import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/auth-store";
import { CreateFileModal } from "~/components/create-file-modal";
import { ModelMessage } from "ai";
import {
  ProjectHeader,
  ViewMode,
  ChatInterface,
  PreviewPane,
  FileSystemView,
} from "~/components/project";

export const Route = createFileRoute("/app/projects/$projectId/")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(
    null,
  );
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [createFileParentPath, setCreateFileParentPath] = useState("");

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

  // Poll chat history
  const { data: chatData } = useQuery(
    trpc.projects.getChatHistory.queryOptions(
      { token: token ?? "", projectId },
      {
        enabled: !!token,
        refetchInterval: 1000, // Poll every second
      },
    ),
  );

  // Fetch VFS files with auto-refresh every 5 seconds
  const {
    data: vfsData,
    isLoading: isLoadingFiles,
    refetch: refetchFiles,
  } = useQuery(
    trpc.projects.getVfsFiles.queryOptions(
      { token: token ?? "", projectId },
      {
        enabled: !!token,
        refetchInterval: 5000, // Auto-refresh every 5 seconds
      },
    ),
  );

  // Fetch file content when a file is selected
  const {
    data: fileContentData,
    isLoading: isLoadingContent,
    refetch: refetchFileContent,
  } = useQuery(
    trpc.projects.getVfsFileContent.queryOptions(
      { token: token ?? "", projectId, filePath: selectedFile ?? "" },
      { enabled: !!token && !!selectedFile },
    ),
  );

  // Create file mutation
  const createFileMutation = useMutation(
    trpc.projects.createVfsFile.mutationOptions({
      onSuccess: () => {
        void refetchFiles();
      },
      onError: (error) => {
        console.error("Failed to create file:", error);
        alert(`Failed to create file: ${error.message}`);
      },
    }),
  );

  // Update file mutation
  const updateFileMutation = useMutation(
    trpc.projects.updateVfsFile.mutationOptions({
      onSuccess: () => {
        void refetchFileContent();
      },
      onError: (error) => {
        console.error("Failed to update file:", error);
        alert(`Failed to update file: ${error.message}`);
      },
    }),
  );

  // Send chat message mutation
  const sendChatMutation = useMutation(
    trpc.projects.sendChatMessage.mutationOptions({
      onError: (error) => {
        console.error("Failed to send message:", error);
        alert(`Failed to send message: ${error.message}`);
      },
    }),
  );

  // Clear chat history mutation
  const clearChatMutation = useMutation(
    trpc.projects.clearChatHistory.mutationOptions({
      onError: (error) => {
        console.error("Failed to clear chat history:", error);
        alert(`Failed to clear chat history: ${error.message}`);
      },
    }),
  );

  // Update selectedFileContent when fileContentData changes
  useEffect(() => {
    if (fileContentData) {
      setSelectedFileContent(fileContentData.content);
    } else {
      setSelectedFileContent(null);
    }
  }, [fileContentData]);

  const handleBack = () => {
    void navigate({ to: "/app" });
  };

  const handleSelectFile = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const handleOpenCreateFile = (parentPath: string) => {
    setCreateFileParentPath(parentPath);
    setIsCreateFileModalOpen(true);
  };

  const handleCreateFile = async (filePath: string, content: string) => {
    await createFileMutation.mutateAsync({
      token: token ?? "",
      projectId,
      filePath,
      content,
    });
  };

  const handleUpdateFile = async (filePath: string, content: string) => {
    await updateFileMutation.mutateAsync({
      token: token ?? "",
      projectId,
      filePath,
      content,
    });
  };

  const handleSendMessage = (message: string) => {
    void sendChatMutation.mutateAsync({
      token: token ?? "",
      projectId,
      message,
    });
  };

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      void clearChatMutation.mutateAsync({
        token: token ?? "",
        projectId,
      });
    }
  };

  const handleDownload = () => {
    void (async () => {
      try {
        const result = await queryClient.fetchQuery(
          trpc.projects.downloadVfsZip.queryOptions({
            token: token ?? "",
            projectId,
          }),
        );

        // Convert base64 to blob and trigger download
        const byteCharacters = atob(result.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/zip" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${result.projectName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to download VFS:", error);
        alert("Failed to download project files");
      }
    })();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  // Error state
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
      <ProjectHeader
        projectName={project.name}
        createdAt={new Date(project.createdAt)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBack={handleBack}
        onDownload={handleDownload}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <ChatInterface
          events={chatData?.events ?? []}
          isProcessing={chatData?.isProcessing ?? false}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
        />

        {/* Right Side - Preview or Filesystem (2/3) */}
        <div className="flex w-2/3 flex-col bg-white">
          {viewMode === "preview" ? (
            <PreviewPane projectId={projectId} />
          ) : (
            <FileSystemView
              files={vfsData?.fileTree ?? []}
              selectedFile={selectedFile}
              fileContent={selectedFileContent}
              isLoadingFiles={isLoadingFiles}
              isLoadingContent={isLoadingContent}
              onSelectFile={handleSelectFile}
              onCreateFile={handleOpenCreateFile}
              onUpdateFile={handleUpdateFile}
            />
          )}
        </div>
      </div>

      {/* Create File Modal */}
      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreateFile={handleCreateFile}
        parentPath={createFileParentPath}
      />
    </div>
  );
}
