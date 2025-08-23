import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeftIcon,
  MessageSquareIcon,
  EyeIcon,
  FolderTreeIcon,
  SendIcon,
  FileIcon,
  FolderIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/auth-store";

export const Route = createFileRoute("/app/projects/$projectId/")({
  component: ProjectDetailPage,
});

type ViewMode = "preview" | "filesystem";

function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId } = Route.useParams();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [chatMessage, setChatMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Fetch project details
  const {
    data: project,
    isLoading,
    error,
  } = useQuery(
    trpc.projects.get.queryOptions(
      { token: token ?? "", projectId },
      { enabled: !!token },
    ),
  );

  const handleBack = () => {
    void navigate({ to: "/app" });
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // TODO: Implement message sending logic
      console.log("Sending message:", chatMessage);
      setChatMessage("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl p-6">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Project not found
            </h2>
            <p className="mb-4 text-gray-600">
              The project you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="mr-1 h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h1>
              <p className="text-xs text-gray-500">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "preview"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <EyeIcon className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode("filesystem")}
              className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "filesystem"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FolderTreeIcon className="h-4 w-4" />
              <span>Files</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Interface - Left Side (1/3) */}
        <div className="flex w-1/3 flex-col border-r border-gray-200 bg-white">
          {/* Chat Header */}
          <div className="flex items-center border-b border-gray-200 px-4 py-3">
            <MessageSquareIcon className="mr-2 h-4 w-4 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">Chat</h2>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Placeholder welcome message */}
              <div className="flex items-start space-x-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <span className="text-xs font-medium text-indigo-600">
                    AI
                  </span>
                </div>
                <div className="flex-1">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <p className="text-sm text-gray-700">
                      Hello! I'm ready to help you with your project. You can
                      ask me questions or request changes to your code.
                    </p>
                  </div>
                  <span className="mt-1 text-xs text-gray-500">Just now</span>
                </div>
              </div>
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
                disabled={!chatMessage.trim()}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SendIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Preview or Filesystem (2/3) */}
        <div className="flex w-2/3 flex-col bg-white">
          {viewMode === "preview" ? (
            <>
              {/* Preview Header */}
              <div className="flex items-center border-b border-gray-200 px-6 py-4">
                <EyeIcon className="mr-2 h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-6">
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
                  <div className="text-center">
                    <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Preview Area
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Your application preview will appear here when it's ready.
                    </p>
                    <p className="mt-4 text-xs text-gray-500">
                      This is where you'll see a live preview of your project as
                      you make changes.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Filesystem Header */}
              <div className="flex items-center border-b border-gray-200 px-6 py-4">
                <FolderTreeIcon className="mr-2 h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  File System
                </h2>
              </div>

              {/* Filesystem Content - Split View */}
              <div className="flex flex-1 overflow-hidden">
                {/* File Tree - Left Side */}
                <div className="w-64 overflow-y-auto border-r border-gray-200 bg-gray-50">
                  <div className="p-3">
                    <div className="space-y-1">
                      {/* Project Root */}
                      <div className="flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200">
                        <ChevronRightIcon className="h-3 w-3 text-gray-500" />
                        <FolderIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          project
                        </span>
                      </div>

                      {/* src folder */}
                      <div className="ml-3">
                        <div className="flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200">
                          <ChevronRightIcon className="h-3 w-3 text-gray-500" />
                          <FolderIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-700">src</span>
                        </div>

                        {/* Files in src */}
                        <div className="ml-3 space-y-1">
                          <div
                            className={`flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200 ${
                              selectedFile === "index.html" ? "bg-blue-100" : ""
                            }`}
                            onClick={() => setSelectedFile("index.html")}
                          >
                            <FileIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              index.html
                            </span>
                          </div>
                          <div
                            className={`flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200 ${
                              selectedFile === "main.ts" ? "bg-blue-100" : ""
                            }`}
                            onClick={() => setSelectedFile("main.ts")}
                          >
                            <FileIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              main.ts
                            </span>
                          </div>
                          <div
                            className={`flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200 ${
                              selectedFile === "styles.css" ? "bg-blue-100" : ""
                            }`}
                            onClick={() => setSelectedFile("styles.css")}
                          >
                            <FileIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              styles.css
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* components folder */}
                      <div className="ml-3">
                        <div className="flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200">
                          <ChevronRightIcon className="h-3 w-3 text-gray-500" />
                          <FolderIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-700">
                            components
                          </span>
                        </div>
                      </div>

                      {/* package.json */}
                      <div
                        className={`flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200 ${
                          selectedFile === "package.json" ? "bg-blue-100" : ""
                        }`}
                        onClick={() => setSelectedFile("package.json")}
                      >
                        <FileIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          package.json
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Content - Right Side */}
                <div className="flex-1 overflow-auto">
                  {selectedFile ? (
                    <div className="h-full">
                      {/* File Header */}
                      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <FileIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {selectedFile}
                          </span>
                        </div>
                      </div>

                      {/* File Content Area */}
                      <div className="p-4">
                        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
                          <code>{`// ${selectedFile}
// File content will be displayed here

${
  selectedFile === "index.html"
    ? `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`
    : selectedFile === "main.ts"
      ? `import { createApp } from './app';

const app = createApp();

app.mount('#root');`
      : selectedFile === "styles.css"
        ? `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`
        : `{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}`
}`}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center p-8">
                      <div className="text-center">
                        <FileIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-4 text-sm text-gray-500">
                          Select a file from the tree to view its contents
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
