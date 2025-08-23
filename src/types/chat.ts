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
  timestamp: z.number(), // Unix timestamp in milliseconds
  agent: z.enum(["chat", "codeGenerator"]),
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
  agent: "chat" | "codeGenerator",
): ChatEvent | null {
  const partResult = contentPartSchema.safeParse(part);
  if (!partResult.success) return null;

  const item = partResult.data;
  const timestamp = Date.now();

  switch (item.type) {
    case "text":
      return {
        eventType: role === "user" ? "userMessage" : "aiMessage",
        markdown: item.text,
        timestamp,
        agent,
      };

    case "reasoning":
      return {
        eventType: "aiReasoning",
        markdown: item.text,
        timestamp,
        agent,
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
        timestamp,
        agent,
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
        timestamp,
        agent,
      };
    }

    default:
      return null;
  }
}

// Helper to convert step data to events
export function stepToEvents(
  step: {
    text?: string;
    reasoning?: Array<{ text: string }> | string;
    toolCalls?: Array<{ toolName: string; input: unknown }>;
    toolResults?: Array<{ toolName: string; output: unknown }>;
  },
  agent: "chat" | "codeGenerator",
): ChatEvent[] {
  const events: ChatEvent[] = [];
  const timestamp = Date.now();

  // Add reasoning if present
  if (step.reasoning) {
    // Handle both array and string formats
    const reasoningText = Array.isArray(step.reasoning)
      ? step.reasoning.map((r) => r.text).join("")
      : step.reasoning;

    if (reasoningText) {
      events.push({
        eventType: "aiReasoning",
        markdown: reasoningText,
        timestamp,
        agent,
      });
    }
  }

  // Add AI text if present
  if (step.text) {
    events.push({
      eventType: "aiMessage",
      markdown: step.text,
      timestamp,
      agent,
    });
  }

  // Add tool calls
  if (step.toolCalls) {
    for (const toolCall of step.toolCalls) {
      const jsonContent = JSON.stringify(toolCall.input, null, 2).replace(
        /```/g,
        "\\`\\`\\`",
      );
      events.push({
        eventType: "toolCall",
        markdown: `**${toolCall.toolName}**\n\`\`\`json\n${jsonContent}\n\`\`\``,
        timestamp,
        agent,
      });
    }
  }

  // Add tool results
  if (step.toolResults) {
    for (const toolResult of step.toolResults) {
      const output = toolResult.output as
        | Record<string, unknown>
        | string
        | null
        | undefined;
      const value =
        typeof output === "object" && output && "value" in output
          ? output.value
          : output;
      let formatted =
        typeof value === "string" ? value : JSON.stringify(value, null, 2);
      formatted = formatted.replace(/```/g, "\\`\\`\\`");

      events.push({
        eventType: "toolResult",
        markdown: `**${toolResult.toolName}**\n\`\`\`\n${formatted}\n\`\`\``,
        timestamp,
        agent,
      });
    }
  }

  return events;
}
