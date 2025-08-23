import { useState } from "react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  PlusIcon,
} from "lucide-react";

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

interface FileTreeProps {
  files: FileTreeNode[];
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (parentPath: string) => void;
}

export function FileTree({
  files,
  selectedFile,
  onSelectFile,
  onCreateFile,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const isHovered = hoveredPath === node.path;

    if (node.type === "folder") {
      return (
        <div key={node.path}>
          <div
            className={`group flex cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-gray-200 ${
              isSelected ? "bg-blue-100" : ""
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(node.path)}
            onMouseEnter={() => setHoveredPath(node.path)}
            onMouseLeave={() => setHoveredPath(null)}
          >
            <div className="flex items-center space-x-1">
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpenIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <FolderIcon className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm text-gray-700">{node.name}</span>
            </div>
            {isHovered && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(node.path);
                }}
                className="invisible rounded p-0.5 text-gray-500 hover:bg-gray-300 hover:text-gray-700 group-hover:visible"
                title="Create new file in this folder"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            )}
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`flex cursor-pointer items-center space-x-1 rounded px-2 py-1 hover:bg-gray-200 ${
          isSelected ? "bg-blue-100" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 24}px` }}
        onClick={() => onSelectFile(node.path)}
      >
        <FileIcon className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600">{node.name}</span>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-xs font-semibold uppercase text-gray-600">
          Files
        </span>
        <button
          onClick={() => onCreateFile("")}
          className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          title="Create new file in root"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="p-2">
        {files.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-gray-500">No files yet</p>
            <button
              onClick={() => onCreateFile("")}
              className="mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              Create First File
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {files.map((node) => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}
