// Extended message types that include tool invocations and other metadata
export interface ExtendedModelMessage {
  id?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | MessagePart[] | null;
  experimental_providerMetadata?: {
    anthropic?: {
      cacheControl?: {
        reasoningContent?: string;
      };
    };
  };
  toolInvocations?: ToolInvocation[];
}

export interface MessagePart {
  type: "text" | "image" | "file";
  text?: string;
  image?: string;
  file?: string;
}

export interface ToolInvocation {
  toolName: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

export function getTextContent(
  content: string | MessagePart[] | null | undefined,
): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is MessagePart => part.type === "text" && !!part.text,
      )
      .map((part) => part.text!)
      .join("");
  }
  return "";
}
