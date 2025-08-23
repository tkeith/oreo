import { generateText, ModelMessage, stepCountIs } from "ai";
import { z } from "zod";
import * as vfs from "~/server/utils/vfs";
import { CLAUDE_CONFIG } from "./constants";
import { updateMessagesForCaching } from "./utils/anthropic-prompt-caching";
import { getChatSystemPrompt } from "./prompts/chat-system-prompt";
import { createVFSTools } from "./vfs-tools";
import { runCodeGenerator } from "./codeGeneratorAgent";

interface AgentContext {
  projectVfs: vfs.VFS;
  projectFiles: string[];
  messages: ModelMessage[];
  onStateUpdate?: () => void;
}

export async function runAgent(
  message: string,
  context: AgentContext,
): Promise<{ response: string }> {
  const workingVfs = context.projectVfs;

  const messages = context.messages;

  if (messages.length === 0) {
    messages.push({
      role: "system",
      content: getChatSystemPrompt(),
    });
  }

  messages.push({
    role: "user",
    content:
      message +
      `\n\n
<additional-context>
<current-files-in-project>
${context.projectFiles.map((f) => `- ${f}`).join("\n")}
</current-files-in-project>
</additional-context>`,
  });

  updateMessagesForCaching(messages);

  context.onStateUpdate?.();

  // Track the number of messages before starting the generation
  let previousReceivedMessageCount = 0;

  const result = await generateText({
    ...CLAUDE_CONFIG,
    stopWhen: stepCountIs(50),
    messages,
    tools: {
      ...createVFSTools(workingVfs, ["/spec"]),
      runCodeGenerator: {
        description:
          "Run the code generator agent to generate code based on an instruction",
        inputSchema: z.object({
          instruction: z
            .string()
            .describe("The instruction for the code generator"),
        }),
        execute: async ({ instruction }: { instruction: string }) => {
          const result = await runCodeGenerator({
            projectVfs: workingVfs,
            instruction,
          });
          // Add code generator messages to chat history
          for (const msg of result.messages) {
            messages.push(msg);
          }
          return result.response;
        },
      },
    },
    onStepFinish(stepResult) {
      // Only add new messages that weren't already in the array
      const newMessages = stepResult.response.messages.slice(
        previousReceivedMessageCount,
      );
      for (const message of newMessages) {
        messages.push(message);
        previousReceivedMessageCount++;
      }
      context.onStateUpdate?.();
    },
  });

  return {
    response: result.text,
  };
}
