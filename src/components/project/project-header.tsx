import { ArrowLeftIcon, EyeIcon, FolderTreeIcon } from "lucide-react";

export type ViewMode = "preview" | "filesystem";

interface ProjectHeaderProps {
  projectName: string;
  createdAt: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onBack: () => void;
}

export function ProjectHeader({
  projectName,
  createdAt,
  viewMode,
  onViewModeChange,
  onBack,
}: ProjectHeaderProps) {
  return (
    <header className="flex-shrink-0 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {projectName}
            </h1>
            <p className="text-xs text-gray-500">
              Created {createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => onViewModeChange("preview")}
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
            onClick={() => onViewModeChange("filesystem")}
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
  );
}
