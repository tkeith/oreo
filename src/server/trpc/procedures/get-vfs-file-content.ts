import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize, readFile } from "~/server/utils/vfs";

export const getVfsFileContent = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
      filePath: z.string(),
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

    const content = readFile(vfs, input.filePath);
    if (content === undefined) {
      throw new Error("File not found");
    }

    return {
      filePath: input.filePath,
      content,
    };
  });
