import { generateText, ModelMessage, stepCountIs } from "ai";
import * as vfs from "~/server/utils/vfs";
import { CLAUDE_CONFIG } from "./constants";
import { updateMessagesForCaching } from "./utils/anthropic-prompt-caching";
import { createVFSTools } from "./vfs-tools";
import { getCodeGeneratorSystemPrompt } from "./prompts/code-generator-system-prompt";
import { stepToEvents, type ChatEvent } from "~/types/chat";

interface CodeGeneratorContext {
  projectVfs: vfs.VFS;
  onStateUpdate?: () => void;
  onEventEmit?: (events: ChatEvent[]) => void;
}

export async function runCodeGenerator(
  context: CodeGeneratorContext,
): Promise<{ response: string }> {
  const messages: ModelMessage[] = [
    {
      role: "system",
      content: getCodeGeneratorSystemPrompt(),
    },
    {
      role: "user",
      content:
        "The spec has been updated. Make sure the code matches the spec.",
    },
  ];

  const result = await generateText({
    ...CLAUDE_CONFIG,
    stopWhen: stepCountIs(50),
    messages,
    tools: createVFSTools(context.projectVfs), // Unrestricted access
    onStepFinish(stepResult) {
      // Emit events for this step
      const events = stepToEvents(stepResult, "codeGenerator");
      if (events.length > 0) {
        context.onEventEmit?.(events);
      }
      // Trigger database update after each step
      context.onStateUpdate?.();
    },
    prepareStep: ({ messages }) => {
      updateMessagesForCaching(messages);
      return {
        messages,
      };
    },
  });

  return {
    response: result.text,
  };
}
