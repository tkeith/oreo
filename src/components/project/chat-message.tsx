import { ModelMessage } from "ai";
import {
  FileTextIcon,
  PencilIcon,
  ListIcon,
  BrainIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useState } from "react";
import {
  ExtendedModelMessage,
  getTextContent,
  type ToolInvocation,
} from "~/types/chat";

interface ChatMessageProps {
  message: ModelMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [showReasoning, setShowReasoning] = useState(false);

  // Cast message to extended type for accessing additional properties
  const extMessage = message as unknown as ExtendedModelMessage;

  const toggleTool = (toolId: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId);
    } else {
      newExpanded.add(toolId);
    }
    setExpandedTools(newExpanded);
  };

  // Handle user messages
  if (message.role === "user") {
    const content = getTextContent(extMessage.content);

    return (
      <div className="flex items-start space-x-2">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-600">
          <span className="text-xs font-medium text-white">U</span>
        </div>
        <div className="flex-1">
          <div className="rounded-lg bg-gray-200 p-2">
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle assistant messages with potential tool calls and reasoning
  if (message.role === "assistant") {
    const hasReasoning =
      extMessage.experimental_providerMetadata?.anthropic?.cacheControl
        ?.reasoningContent;
    const toolCalls = extMessage.toolInvocations || [];
    const textContent = getTextContent(extMessage.content);

    return (
      <div className="flex items-start space-x-2">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
          <span className="text-xs font-medium text-indigo-600">AI</span>
        </div>
        <div className="flex-1 space-y-2">
          {/* Reasoning toggle */}
          {hasReasoning && (
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center space-x-1 rounded bg-purple-50 px-2 py-1 text-xs text-purple-700 hover:bg-purple-100"
            >
              <BrainIcon className="h-3 w-3" />
              <span>Reasoning</span>
              {showReasoning ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </button>
          )}

          {/* Reasoning content */}
          {showReasoning && hasReasoning && (
            <div className="rounded-lg bg-purple-50 p-2 text-xs">
              <p className="whitespace-pre-wrap text-purple-700">
                {hasReasoning}
              </p>
            </div>
          )}

          {/* Tool calls */}
          {toolCalls.length > 0 && (
            <div className="space-y-1">
              {toolCalls.map((tool: ToolInvocation, idx: number) => {
                const toolId = `${extMessage.id || idx}-${idx}`;
                const isExpanded = expandedTools.has(toolId);
                const toolIcon = getToolIcon(tool.toolName);

                return (
                  <div key={idx} className="rounded-lg bg-blue-50 p-2">
                    <button
                      onClick={() => toggleTool(toolId)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-2">
                        {toolIcon}
                        <span className="text-xs font-medium text-blue-700">
                          {getToolLabel(tool.toolName)}
                        </span>
                        {tool.args && (
                          <span className="text-xs text-blue-600">
                            {getToolArgsSummary(tool.toolName, tool.args)}
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon className="h-3 w-3 text-blue-600" />
                      ) : (
                        <ChevronRightIcon className="h-3 w-3 text-blue-600" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        {/* Tool arguments */}
                        {tool.args && Object.keys(tool.args).length > 0 && (
                          <div className="rounded bg-white p-2">
                            <p className="mb-1 text-xs font-medium text-gray-600">
                              Arguments:
                            </p>
                            <pre className="overflow-x-auto text-xs text-gray-700">
                              {JSON.stringify(tool.args, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Tool result */}
                        {tool.result !== undefined && tool.result !== null && (
                          <div className="rounded bg-white p-2">
                            <p className="mb-1 text-xs font-medium text-gray-600">
                              Result:
                            </p>
                            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-gray-700">
                              {typeof tool.result === "string"
                                ? tool.result
                                : JSON.stringify(tool.result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Main message content */}
          {textContent && (
            <div className="rounded-lg bg-gray-100 p-2">
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {textContent}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle system messages
  if (message.role === "system") {
    return (
      <div className="flex items-start space-x-2">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-400">
          <span className="text-xs font-medium text-white">S</span>
        </div>
        <div className="flex-1">
          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-600">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function getToolIcon(toolName: string) {
  switch (toolName) {
    case "readFile":
      return <FileTextIcon className="h-3 w-3 text-blue-600" />;
    case "writeFile":
      return <PencilIcon className="h-3 w-3 text-blue-600" />;
    case "listFiles":
      return <ListIcon className="h-3 w-3 text-blue-600" />;
    default:
      return <FileTextIcon className="h-3 w-3 text-blue-600" />;
  }
}

function getToolLabel(toolName: string) {
  switch (toolName) {
    case "readFile":
      return "Read File";
    case "writeFile":
      return "Write File";
    case "listFiles":
      return "List Files";
    default:
      return toolName;
  }
}

function getToolArgsSummary(
  toolName: string,
  args: Record<string, unknown>,
): string {
  switch (toolName) {
    case "readFile":
    case "writeFile":
      return (args.path as string) || "";
    case "listFiles":
      return "";
    default:
      return "";
  }
}
