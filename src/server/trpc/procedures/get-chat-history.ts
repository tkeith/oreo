import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import type { ChatEvent } from "~/types/chat";

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
        agentEvents: true,
        isProcessing: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Parse agent events
    let events: ChatEvent[] = [];
    try {
      events = JSON.parse(project.agentEvents || "[]") as ChatEvent[];
    } catch (error) {
      console.error("Failed to parse agent events:", error);
      events = [];
    }

    return {
      events,
      isProcessing: project.isProcessing,
    };
  });
