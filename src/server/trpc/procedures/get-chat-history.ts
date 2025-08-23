import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { ModelMessage } from "ai";

export const getChatHistory = baseProcedure
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
      select: {
        chatHistory: true,
        isProcessing: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Parse chat history
    let messages: ModelMessage[] = [];
    try {
      messages = JSON.parse(project.chatHistory || "[]") as ModelMessage[];
    } catch (error) {
      console.error("Failed to parse chat history:", error);
      messages = [];
    }

    return {
      messages,
      isProcessing: project.isProcessing,
    };
  });
