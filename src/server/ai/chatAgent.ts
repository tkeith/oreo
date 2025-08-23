import { generateText, ModelMessage, stepCountIs } from "ai";
import { z } from "zod";
import * as vfs from "~/server/utils/vfs";
import { CLAUDE_CONFIG } from "./constants";
import { updateMessagesForCaching } from "./utils/anthropic-prompt-caching";
import { getChatSystemPrompt } from "./prompts/chat-system-prompt";
import { createVFSTools, filterFilesByPrefixes } from "./vfs-tools";
import { runCodeGenerator } from "./codeGeneratorAgent";
import { stepToEvents, type ChatEvent } from "~/types/chat";
import { stripXmlTags } from "~/server/utils/strip-xml";

interface AgentContext {
  projectVfs: vfs.VFS;
  projectFiles: string[];
  messages: ModelMessage[];
  onStateUpdate?: () => void;
  onEventEmit?: (events: ChatEvent[]) => void;
}

export async function runAgent(
  message: string,
  context: AgentContext,
): Promise<{ response: string }> {
  const workingVfs = context.projectVfs;
  const allowedPrefixes = ["/spec"];

  const messages = context.messages;

  if (messages.length === 0) {
    messages.push({
      role: "system",
      content: getChatSystemPrompt(),
    });
  }

  // Add user message to chat history
  const filteredFiles = filterFilesByPrefixes(
    context.projectFiles,
    allowedPrefixes,
  );
  const userMessageContent =
    message +
    `\n\n
<additional-context>
<current-files-in-project>
${filteredFiles.length > 0 ? filteredFiles.map((f) => `- ${f}`).join("\n") : "No files in project yet."}
</current-files-in-project>
</additional-context>`;

  messages.push({
    role: "user",
    content: userMessageContent,
  });

  updateMessagesForCaching(messages);

  // Emit user message event
  context.onEventEmit?.([
    {
      eventType: "userMessage",
      markdown: stripXmlTags(message), // Strip additional context
      timestamp: Date.now(),
      agent: "chat",
    },
  ]);

  context.onStateUpdate?.();

  // Track the number of messages before starting the generation
  let previousReceivedMessageCount = 0;

  const result = await generateText({
    ...CLAUDE_CONFIG,
    stopWhen: stepCountIs(50),
    messages,
    tools: {
      ...createVFSTools(workingVfs, allowedPrefixes),
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
            onEventEmit: context.onEventEmit,
          });
          // Note: We don't add code generator messages to chat history anymore
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

      // Emit events for this step
      const events = stepToEvents(stepResult, "chat");
      if (events.length > 0) {
        context.onEventEmit?.(events);
      }

      context.onStateUpdate?.();
    },
  });

  return {
    response: result.text,
  };
}
