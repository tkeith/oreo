import { useState, useEffect, useRef } from "react";
import { MessageSquareIcon, SendIcon, Trash2Icon } from "lucide-react";
import { ModelMessage } from "ai";
import { ChatMessage } from "./chat-message";
import type { ExtendedModelMessage } from "~/types/chat";

interface ChatInterfaceProps {
  messages: ModelMessage[];
  isProcessing?: boolean;
  onSendMessage?: (message: string) => void;
  onClearChat?: () => void;
}

export function ChatInterface({
  messages,
  isProcessing,
  onSendMessage,
  onClearChat,
}: ChatInterfaceProps) {
  const [chatMessage, setChatMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (chatMessage.trim() && !isProcessing) {
      onSendMessage?.(chatMessage);
      setChatMessage("");
    }
  };

  return (
    <div className="flex w-1/3 flex-col border-r border-gray-200 bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <MessageSquareIcon className="mr-2 h-4 w-4 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Chat</h2>
        </div>
        {messages.length > 0 && onClearChat && (
          <button
            onClick={onClearChat}
            disabled={isProcessing}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              isProcessing
                ? "Cannot clear while processing"
                : "Clear chat history"
            }
          >
            <Trash2Icon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-start space-x-2">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                <span className="text-xs font-medium text-indigo-600">AI</span>
              </div>
              <div className="flex-1">
                <div className="rounded-lg bg-gray-100 p-2">
                  <p className="text-sm text-gray-700">
                    Hello! I can help you read and modify files in your project.
                    Just ask!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages
              .filter((msg) => msg.role !== "system") // Don't show system messages by default
              .map((msg, idx) => {
                const extMsg = msg as unknown as ExtendedModelMessage;
                return (
                  <ChatMessage key={extMsg.id || `msg-${idx}`} message={msg} />
                );
              })
          )}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
              <div className="animation-delay-200 h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
              <div className="animation-delay-400 h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatMessage.trim() || isProcessing}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
