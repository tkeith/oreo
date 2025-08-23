import { z } from "zod";
import * as vfs from "~/server/utils/vfs";

export function createVFSTools(
  workingVfs: vfs.VFS,
  allowedPrefixes: string[] = [],
) {
  const checkPath = (path: string): boolean => {
    if (allowedPrefixes.length === 0) return true;
    return allowedPrefixes.some((prefix) => path.startsWith(prefix));
  };

  return {
    readFile: {
      description: "Read the contents of a file",
      inputSchema: z.object({
        path: z.string().describe("The file path to read"),
      }),
      execute: async ({ path }: { path: string }) => {
        if (!checkPath(path)) {
          return `Access denied: ${path}`;
        }
        const content = vfs.readFile(workingVfs, path);
        if (content === undefined) {
          return `File not found: ${path}`;
        }
        return content;
      },
    },
    writeFile: {
      description: "Write or update a file",
      inputSchema: z.object({
        path: z.string().describe("The file path to write"),
        content: z.string().describe("The content to write to the file"),
      }),
      execute: async ({ path, content }: { path: string; content: string }) => {
        if (!checkPath(path)) {
          return `Access denied: ${path}`;
        }
        vfs.writeFile(workingVfs, path, content);
        return `File written: ${path}`;
      },
    },
    listFiles: {
      description: "List all files in the project",
      inputSchema: z.object({}),
      execute: async () => {
        const files = vfs
          .listFiles(workingVfs)
          .filter((file) => checkPath(file));
        return files.join("\n");
      },
    },
  };
}
