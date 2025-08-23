import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import {
  deserialize,
  writeFile,
  serialize,
  fileExists,
} from "~/server/utils/vfs";

export const createVfsFile = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
      filePath: z.string(),
      content: z.string().default(""),
    }),
  )
  .mutation(async ({ input }) => {
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

    // Check if file already exists
    if (fileExists(vfs, input.filePath)) {
      throw new Error("File already exists");
    }

    // Create the file
    writeFile(vfs, input.filePath, input.content);

    // Save the updated VFS
    const updatedVfsString = serialize(vfs);
    await db.project.update({
      where: { id: input.projectId },
      data: { vfs: updatedVfsString },
    });

    return {
      success: true,
      filePath: input.filePath,
    };
  });
