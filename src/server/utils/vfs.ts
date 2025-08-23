import { z } from "zod";

// VFS Schema
export const VFSSchema = z.object({
  filesContents: z.record(z.string(), z.string()),
});

export type VFS = z.infer<typeof VFSSchema>;

/**
 * Creates a new empty VFS
 */
export function createVFS(): VFS {
  return {
    filesContents: {},
  };
}

/**
 * Creates a VFS from a template object (filesContents mapping)
 */
export function createVFSFromTemplate(template: Record<string, string>): VFS {
  return {
    filesContents: { ...template },
  };
}

/**
 * Reads a file from the VFS
 * @returns The file content or undefined if the file doesn't exist
 */
export function readFile(vfs: VFS, filePath: string): string | undefined {
  return vfs.filesContents[filePath];
}

/**
 * Writes a file to the VFS (mutates in place)
 */
export function writeFile(vfs: VFS, filePath: string, content: string): void {
  vfs.filesContents[filePath] = content;
}

/**
 * Deletes a file from the VFS (mutates in place)
 */
export function deleteFile(vfs: VFS, filePath: string): void {
  delete vfs.filesContents[filePath];
}

/**
 * Lists all files in the VFS
 * @returns Array of file paths
 */
export function listFiles(vfs: VFS): string[] {
  return Object.keys(vfs.filesContents);
}

/**
 * Lists files in a specific directory
 * @returns Array of file paths in the directory
 */
export function listFilesInDirectory(vfs: VFS, dirPath: string): string[] {
  const normalizedDir = dirPath.endsWith("/") ? dirPath : dirPath + "/";
  return Object.keys(vfs.filesContents).filter((filePath) =>
    filePath.startsWith(normalizedDir),
  );
}

/**
 * Checks if a file exists in the VFS
 */
export function fileExists(vfs: VFS, filePath: string): boolean {
  return filePath in vfs.filesContents;
}

/**
 * Serializes VFS to JSON string
 */
export function serialize(vfs: VFS): string {
  // Validate VFS structure before serializing
  const validated = VFSSchema.parse(vfs);
  return JSON.stringify(validated);
}

/**
 * Deserializes JSON string to VFS
 * @returns VFS object or null if data is invalid
 */
export function deserialize(data: string): VFS | null {
  try {
    const jsonData: unknown = JSON.parse(data);
    const parsed = VFSSchema.safeParse(jsonData);
    if (!parsed.success) {
      console.error("Invalid VFS data:", parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error("Failed to parse VFS JSON:", error);
    return null;
  }
}

/**
 * Renames a file in the VFS (mutates in place)
 * @returns true if successful, false if source file doesn't exist
 */
export function renameFile(
  vfs: VFS,
  oldPath: string,
  newPath: string,
): boolean {
  if (!(oldPath in vfs.filesContents)) {
    return false;
  }

  const content = vfs.filesContents[oldPath];
  delete vfs.filesContents[oldPath];
  vfs.filesContents[newPath] = content!;
  return true;
}

/**
 * Copies a file in the VFS (mutates in place)
 * @returns true if successful, false if source file doesn't exist
 */
export function copyFile(
  vfs: VFS,
  sourcePath: string,
  destPath: string,
): boolean {
  const content = vfs.filesContents[sourcePath];
  if (content === undefined) {
    return false;
  }

  vfs.filesContents[destPath] = content;
  return true;
}
