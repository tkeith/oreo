import { generateText, ModelMessage, stepCountIs } from "ai";
import { z } from "zod";
import * as vfs from "~/server/utils/vfs";
import { CLAUDE_CONFIG } from "./constants";

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
      content: `You are a helpful AI assistant for a code project. You can read and write files in the project.

When asked to make changes, be helpful and make the requested modifications to the files.`,
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

  context.onStateUpdate?.();

  const result = await generateText({
    ...CLAUDE_CONFIG,
    stopWhen: stepCountIs(50),
    messages,
    tools: {
      readFile: {
        description: "Read the contents of a file",
        inputSchema: z.object({
          path: z.string().describe("The file path to read"),
        }),
        execute: async ({ path }: { path: string }) => {
          const content = vfs.readFile(workingVfs, path);
          if (content === undefined) {
            return `File not found: ${path}`;
          }
          return content;
        },
      },
      writeFile: {
        description: "Write or update a file",
        inputSchema: z.object({
          path: z.string().describe("The file path to write"),
          content: z.string().describe("The content to write to the file"),
        }),
        execute: async ({
          path,
          content,
        }: {
          path: string;
          content: string;
        }) => {
          vfs.writeFile(workingVfs, path, content);
          return `File written: ${path}`;
        },
      },
      listFiles: {
        description: "List all files in the project",
        inputSchema: z.object({}),
        execute: async () => {
          const files = vfs.listFiles(workingVfs);
          return files.join("\n");
        },
      },
    },
    onStepFinish(stepResult) {
      for (const message of stepResult.response.messages) {
        messages.push(message);
      }
      context.onStateUpdate?.();
    },
  });

  return {
    response: result.text,
  };
}
