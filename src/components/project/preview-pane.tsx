import { EyeIcon } from "lucide-react";

export function PreviewPane() {
  return (
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
              This is where you'll see a live preview of your project as you
              make changes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
