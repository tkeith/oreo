import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";

export const clearChatHistory = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
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

    // Clear the chat history
    await db.project.update({
      where: { id: input.projectId },
      data: { chatHistory: "[]" },
    });

    return { success: true };
  });

