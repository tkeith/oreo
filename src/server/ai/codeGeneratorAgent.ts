import { generateText, ModelMessage, stepCountIs } from "ai";
import * as vfs from "~/server/utils/vfs";
import { CLAUDE_CONFIG } from "./constants";
import { updateMessagesForCaching } from "./utils/anthropic-prompt-caching";
import { createVFSTools } from "./vfs-tools";
import { getCodeGeneratorSystemPrompt } from "./prompts/code-generator-system-prompt";

interface CodeGeneratorContext {
  projectVfs: vfs.VFS;
  instruction: string;
}

export async function runCodeGenerator(
  context: CodeGeneratorContext,
): Promise<{ response: string; messages: ModelMessage[] }> {
  const messages: ModelMessage[] = [
    {
      role: "system",
      content: getCodeGeneratorSystemPrompt(),
    },
    {
      role: "user",
      content: context.instruction,
    },
  ];

  updateMessagesForCaching(messages);

  let previousReceivedMessageCount = 0;

  const result = await generateText({
    ...CLAUDE_CONFIG,
    stopWhen: stepCountIs(50),
    messages,
    tools: createVFSTools(context.projectVfs), // Unrestricted access
    onStepFinish(stepResult) {
      const newMessages = stepResult.response.messages.slice(
        previousReceivedMessageCount,
      );
      for (const message of newMessages) {
        messages.push(message);
        previousReceivedMessageCount++;
      }
    },
  });

  return {
    response: result.text,
    messages,
  };
}
