import { useState, useEffect } from "react";
import {
  FolderTreeIcon,
  FileIcon,
  EditIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { FileTree } from "~/components/file-tree";

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

interface FileSystemViewProps {
  files: FileTreeNode[];
  selectedFile: string | null;
  fileContent: string | null;
  isLoadingFiles: boolean;
  isLoadingContent: boolean;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (parentPath: string) => void;
  onUpdateFile: (filePath: string, content: string) => Promise<void>;
}

export function FileSystemView({
  files,
  selectedFile,
  fileContent,
  isLoadingFiles,
  isLoadingContent,
  onSelectFile,
  onCreateFile,
  onUpdateFile,
}: FileSystemViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState("");

  // Reset editing state when file selection changes
  useEffect(() => {
    setIsEditing(false);
    setEditingContent("");
  }, [selectedFile]);

  const handleStartEdit = () => {
    setEditingContent(fileContent ?? "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedFile) return;
    await onUpdateFile(selectedFile, editingContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingContent("");
  };

  return (
    <>
      {/* Filesystem Header */}
      <div className="flex items-center border-b border-gray-200 px-6 py-4">
        <FolderTreeIcon className="mr-2 h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">File System</h2>
      </div>

      {/* Filesystem Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Tree - Left Side */}
        <div className="w-64 overflow-y-auto border-r border-gray-200">
          {isLoadingFiles ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">Loading files...</p>
            </div>
          ) : (
            <FileTree
              files={files}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onCreateFile={onCreateFile}
            />
          )}
        </div>

        {/* File Content - Right Side */}
        <div className="flex-1 overflow-auto">
          {selectedFile ? (
            <div className="h-full">
              {/* File Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedFile}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => void handleSaveEdit()}
                          className="rounded p-1 text-green-600 hover:bg-green-50"
                          title="Save"
                        >
                          <SaveIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Cancel"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100"
                        title="Edit"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* File Content Area */}
              <div className="p-4">
                {isLoadingContent ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-gray-500">
                      Loading file content...
                    </p>
                  </div>
                ) : isEditing ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="h-full w-full rounded-lg border border-gray-300 bg-gray-900 p-4 font-mono text-sm text-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    style={{ minHeight: "400px" }}
                  />
                ) : (
                  <pre className="overflow-x-hidden whitespace-pre-wrap break-words rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
                    <code>{fileContent ?? ""}</code>
                  </pre>
                )}
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
  );
}
