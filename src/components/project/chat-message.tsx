import Markdown from "markdown-to-jsx";
import type { ChatEvent } from "~/types/chat";

interface ChatMessageProps {
  event: ChatEvent;
}

export function ChatMessage({ event }: ChatMessageProps) {
  // Style configuration for each event type
  const styles = {
    userMessage: {
      avatar: { bg: "bg-gray-600", text: "U", color: "text-white" },
      content: "bg-gray-200 text-gray-700",
    },
    aiMessage: {
      avatar: { bg: "bg-indigo-100", text: "AI", color: "text-indigo-600" },
      content: "bg-gray-100 text-gray-700",
    },
    aiReasoning: {
      avatar: { bg: "bg-purple-100", text: "🤔", color: "text-purple-600" },
      content: "bg-purple-50 text-purple-700 italic",
    },
    toolCall: {
      avatar: { bg: "bg-blue-100", text: "🔧", color: "text-blue-600" },
      content: "bg-blue-50 text-blue-900",
    },
    toolResult: {
      avatar: { bg: "bg-green-100", text: "✓", color: "text-green-600" },
      content: "bg-green-50 text-green-900",
    },
  };

  const style = styles[event.eventType];

  return (
    <div className="flex items-start space-x-2">
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${style.avatar.bg}`}
      >
        <span className={`text-xs font-medium ${style.avatar.color}`}>
          {style.avatar.text}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`overflow-hidden rounded-lg p-2 ${style.content}`}>
          <article className="prose prose-sm max-w-none overflow-x-hidden break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_pre]:overflow-x-auto">
            <Markdown>{event.markdown}</Markdown>
          </article>
        </div>
      </div>
    </div>
  );
}
