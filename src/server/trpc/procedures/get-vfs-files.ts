import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize, listFiles } from "~/server/utils/vfs";

export const getVfsFiles = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await verifyToken(input.token);

    if (!user) {
      throw new Error("Unauthorized");
    }

    const project = await db.project.findFirst({
      where: {
        id: input.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const vfs = deserialize(project.vfs);
    if (!vfs) {
      throw new Error("Invalid VFS data");
    }

    const files = listFiles(vfs);

    // Organize files into a tree structure
    const fileTree = buildFileTree(files);

    return {
      files,
      fileTree,
    };
  });

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

function buildFileTree(filePaths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const nodeMap = new Map<string, FileTreeNode>();

  // Sort paths to ensure parent directories come before their children
  const sortedPaths = [...filePaths].sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split("/");
    let currentPath = "";
    let parentNode: FileTreeNode[] = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue; // Skip empty parts

      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!nodeMap.has(currentPath)) {
        const node: FileTreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };

        nodeMap.set(currentPath, node);
        parentNode.push(node);
      }

      if (!isFile) {
        const node = nodeMap.get(currentPath);
        if (node && node.children) {
          parentNode = node.children;
        }
      }
    }
  }

  return root;
}
