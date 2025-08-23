import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize, serialize, listFiles } from "~/server/utils/vfs";
import { runAgent, type ChatMessage } from "~/server/ai/agent";

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
    let chatHistory: ChatMessage[] = [];
    try {
      chatHistory = JSON.parse(project.chatHistory || "[]") as ChatMessage[];
    } catch (error) {
      console.error("Failed to parse chat history:", error);
      chatHistory = [];
    }

    // Run the AI agent with chat history
    const { response } = await runAgent(input.message, {
      projectVfs: vfs,
      projectFiles: files,
      chatHistory,
    });

    // Update chat history with the new message and response
    const updatedChatHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: input.message },
      { role: "assistant", content: response },
    ];

    // Save the updated VFS and chat history
    const updatedVfsString = serialize(vfs);
    const updateData: { vfs?: string; chatHistory: string } = {
      chatHistory: JSON.stringify(updatedChatHistory),
    };

    if (updatedVfsString !== project.vfs) {
      updateData.vfs = updatedVfsString;
    }

    await db.project.update({
      where: { id: input.projectId },
      data: updateData,
    });

    return {
      response,
      filesModified: updatedVfsString !== project.vfs,
    };
  });
