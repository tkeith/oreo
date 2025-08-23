import { generateText, ModelMessage, stepCountIs } from "ai";
import { createHash } from "crypto";
import stringify from "json-stable-stringify";
import * as vfs from "~/server/utils/vfs";
import { CLAUDE_CONFIG } from "./constants";
import { updateMessagesForCaching } from "./utils/anthropic-prompt-caching";
import { getChatSystemPrompt } from "./prompts/chat-system-prompt";
import { createVFSTools, filterFilesByPrefixes } from "./vfs-tools";
import { stepToEvents, type ChatEvent } from "~/types/chat";
import { stripXmlTags } from "~/server/utils/strip-xml";

interface AgentContext {
  projectVfs: vfs.VFS;
  projectFiles: string[];
  messages: ModelMessage[];
  projectId?: string;
  onStateUpdate?: () => void;
  onEventEmit?: (events: ChatEvent[]) => void;
}

// Helper to get hash of spec files
function getSpecHash(workingVfs: vfs.VFS): string {
  const specFiles = vfs
    .listFiles(workingVfs)
    .filter((f) => f.startsWith("spec/"));
  const specContents: Record<string, string> = {};

  for (const file of specFiles.sort()) {
    const content = vfs.readFile(workingVfs, file);
    if (content !== undefined) {
      specContents[file] = content;
    }
  }

  return createHash("sha256")
    .update(stringify(specContents) ?? "{}")
    .digest("hex");
}

export async function runAgent(
  message: string,
  context: AgentContext,
): Promise<{ response: string; specModified: boolean }> {
  const workingVfs = context.projectVfs;
  const allowedPrefixes = ["spec/"];

  // Get spec hash before running agent
  const specHashBefore = getSpecHash(workingVfs);

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
    tools: createVFSTools(workingVfs, allowedPrefixes),
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
    prepareStep: ({ messages }) => {
      updateMessagesForCaching(messages);
      return {
        messages,
      };
    },
  });

  // Check if spec was modified by comparing hashes
  const specHashAfter = getSpecHash(workingVfs);
  const specModified = specHashBefore !== specHashAfter;

  return {
    response: result.text,
    specModified,
  };
}
