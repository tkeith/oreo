import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize, serialize, listFiles } from "~/server/utils/vfs";
import { runAgent } from "~/server/ai/agent";

export const sendChatMessage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
      message: z.string(),
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

    const files = listFiles(vfs);

    // Run the AI agent
    const { response, updatedVfs } = await runAgent(input.message, {
      projectVfs: vfs,
      projectFiles: files,
    });

    // Save the updated VFS if changed
    const updatedVfsString = serialize(updatedVfs);
    if (updatedVfsString !== project.vfs) {
      await db.project.update({
        where: { id: input.projectId },
        data: { vfs: updatedVfsString },
      });
    }

    return {
      response,
      filesModified: updatedVfsString !== project.vfs,
    };
  });
