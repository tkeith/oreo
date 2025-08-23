import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize, serialize, listFiles } from "~/server/utils/vfs";
import { runAgent } from "~/server/ai/chatAgent";
import { ModelMessage } from "ai";
import type { ChatEvent } from "~/types/chat";

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

    // Check if already processing
    if (project.isProcessing) {
      throw new Error("Agent is already processing a request");
    }

    // Set processing flag
    await db.project.update({
      where: { id: input.projectId },
      data: { isProcessing: true },
    });

    // Run the agent in the background
    void (async () => {
      try {
        const vfs = deserialize(project.vfs);
        if (!vfs) {
          throw new Error("Invalid VFS data");
        }

        const files = listFiles(vfs);

        // Parse existing chat history or initialize empty array
        let chatHistory: ModelMessage[] = [];
        try {
          chatHistory = JSON.parse(
            project.chatHistory || "[]",
          ) as ModelMessage[];
        } catch (error) {
          console.error("Failed to parse chat history:", error);
          chatHistory = [];
        }

        // Parse existing agent events or initialize empty array
        let agentEvents: ChatEvent[] = [];
        try {
          agentEvents = JSON.parse(project.agentEvents || "[]") as ChatEvent[];
        } catch (error) {
          console.error("Failed to parse agent events:", error);
          agentEvents = [];
        }

        // Run the AI agent with chat history
        await runAgent(input.message, {
          projectVfs: vfs,
          projectFiles: files,
          messages: chatHistory,
          onStateUpdate: () => {
            db.project
              .update({
                where: { id: input.projectId },
                data: {
                  chatHistory: JSON.stringify(chatHistory),
                  vfs: serialize(vfs),
                },
              })
              .catch((error) => {
                console.error("Failed to update project:", error);
              });
          },
          onEventEmit: (events) => {
            // Append new events to agentEvents array
            agentEvents.push(...events);

            // Save to database
            db.project
              .update({
                where: { id: input.projectId },
                data: {
                  agentEvents: JSON.stringify(agentEvents),
                },
              })
              .catch((error) => {
                console.error("Failed to update agent events:", error);
              });
          },
        });

        // Clear processing flag when done
        await db.project.update({
          where: { id: input.projectId },
          data: { isProcessing: false },
        });
      } catch (error) {
        console.error("Agent processing error:", error);
        // Clear processing flag on error
        await db.project.update({
          where: { id: input.projectId },
          data: { isProcessing: false },
        });
      }
    })();

    return {
      success: true,
      message: "Processing started",
    };
  });
