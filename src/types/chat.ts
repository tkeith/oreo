import { z } from "zod";

// Event schema for client display
export const chatEventSchema = z.object({
  eventType: z.enum([
    "userMessage",
    "aiMessage",
    "aiReasoning",
    "toolCall",
    "toolResult",
  ]),
  markdown: z.string(),
});

export type ChatEvent = z.infer<typeof chatEventSchema>;

// Schema for reasoning content
const reasoningContentSchema = z
  .object({
    type: z.literal("reasoning"),
    text: z.string(),
  })
  .passthrough();

// Schema for text content
const textContentSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .passthrough();

// Schema for tool calls
const toolCallSchema = z
  .object({
    type: z.literal("tool-call"),
    toolName: z.string(),
    input: z.unknown(),
  })
  .passthrough();

// Schema for tool results
const toolResultSchema = z
  .object({
    type: z.literal("tool-result"),
    toolName: z.string(),
    output: z.unknown(),
  })
  .passthrough();

// Union of all content types
const contentPartSchema = z.union([
  reasoningContentSchema,
  textContentSchema,
  toolCallSchema,
  toolResultSchema,
]);

// Convert a single content part to an event
export function contentPartToEvent(
  part: unknown,
  role: string,
): ChatEvent | null {
  const partResult = contentPartSchema.safeParse(part);
  if (!partResult.success) return null;

  const item = partResult.data;

  switch (item.type) {
    case "text":
      return {
        eventType: role === "user" ? "userMessage" : "aiMessage",
        markdown: item.text,
      };

    case "reasoning":
      return {
        eventType: "aiReasoning",
        markdown: item.text,
      };

    case "tool-call": {
      // Escape triple backticks in the JSON content
      const jsonContent = JSON.stringify(item.input, null, 2).replace(
        /```/g,
        "\\`\\`\\`",
      );
      return {
        eventType: "toolCall",
        markdown: `**${item.toolName}**\n\`\`\`json\n${jsonContent}\n\`\`\``,
      };
    }

    case "tool-result": {
      const outputData = item.output as
        | Record<string, unknown>
        | string
        | null
        | undefined;
      const output =
        typeof outputData === "object" && outputData && "value" in outputData
          ? outputData.value
          : outputData;
      let formatted =
        typeof output === "string" ? output : JSON.stringify(output, null, 2);

      // Escape triple backticks in the output content
      formatted = formatted.replace(/```/g, "\\`\\`\\`");

      return {
        eventType: "toolResult",
        markdown: `**${item.toolName}**\n\`\`\`\n${formatted}\n\`\`\``,
      };
    }

    default:
      return null;
  }
}
