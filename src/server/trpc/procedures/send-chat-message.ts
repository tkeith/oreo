import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize, serialize, listFiles } from "~/server/utils/vfs";
import { runAgent } from "~/server/ai/agent";
import { ModelMessage } from "ai";

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

    // Parse existing chat history or initialize empty array
    let chatHistory: ModelMessage[] = [];
    try {
      chatHistory = JSON.parse(project.chatHistory || "[]") as ModelMessage[];
    } catch (error) {
      console.error("Failed to parse chat history:", error);
      chatHistory = [];
    }

    // Run the AI agent with chat history
    const { response } = await runAgent(input.message, {
      projectVfs: vfs,
      projectFiles: files,
      messages: chatHistory,
      onStateUpdate: () => {
        void db.project.update({
          where: { id: input.projectId },
          data: {
            chatHistory: JSON.stringify(chatHistory),
            vfs: serialize(vfs),
          },
        });
      },
    });

    return {
      response,
    };
  });
