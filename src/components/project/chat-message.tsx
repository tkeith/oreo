import Markdown from "markdown-to-jsx";
import type { ChatEvent } from "~/types/chat";

interface ChatMessageProps {
  event: ChatEvent;
}

export function ChatMessage({ event }: ChatMessageProps) {
  // Style configuration for content
  const contentStyles = {
    userMessage: "bg-blue-600 text-white",
    aiMessage: "bg-gray-100 text-gray-700",
    aiReasoning: "bg-gray-100 text-gray-700 italic",
    toolCall: "bg-blue-50 text-blue-900",
    toolResult: "bg-green-50 text-green-900",
  };

  const isUser = event.eventType === "userMessage";
  const isReasoning = event.eventType === "aiReasoning";

  // For user messages, render on the right side
  if (isUser) {
    return (
      <div className="flex items-start justify-end space-x-2">
        <div className="max-w-[70%]">
          <div
            className={`overflow-hidden rounded-lg p-2 ${contentStyles[event.eventType]}`}
          >
            <article className="prose prose-sm prose-invert max-w-none overflow-x-hidden break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_pre]:overflow-x-auto">
              <Markdown>{event.markdown}</Markdown>
            </article>
          </div>
        </div>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-600">
          <span className="text-xs font-medium text-white">You</span>
        </div>
      </div>
    );
  }

  // For system messages, render on the left side with Oreo avatar
  return (
    <div className="flex items-start space-x-2">
      <img
        src={isReasoning ? "/oreo-thinking.png" : "/oreo-logo.png"}
        alt="Oreo"
        className="h-8 w-8 flex-shrink-0 rounded-full object-contain"
      />
      <div className="min-w-0 max-w-[70%] flex-1">
        <div
          className={`overflow-hidden rounded-lg p-2 ${contentStyles[event.eventType]}`}
        >
          <article className="prose prose-sm max-w-none overflow-x-hidden break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_pre]:overflow-x-auto">
            <Markdown>{event.markdown}</Markdown>
          </article>
        </div>
      </div>
    </div>
  );
}
