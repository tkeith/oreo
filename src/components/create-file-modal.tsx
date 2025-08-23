import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FileIcon, XIcon } from "lucide-react";

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (filePath: string, content: string) => Promise<void>;
  parentPath: string;
}

export function CreateFileModal({
  isOpen,
  onClose,
  onCreateFile,
  parentPath,
}: CreateFileModalProps) {
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!fileName.trim()) return;

    setIsCreating(true);
    const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;

    void onCreateFile(fullPath, fileContent)
      .then(() => {
        setFileName("");
        setFileContent("");
        onClose();
      })
      .catch((error) => {
        console.error("Failed to create file:", error);
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const handleClose = () => {
    if (!isCreating) {
      setFileName("");
      setFileContent("");
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <FileIcon
                        className="h-6 w-6 text-indigo-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 flex-1 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        Create New File
                      </Dialog.Title>
                      <div className="mt-4">
                        <div className="mb-4">
                          <label
                            htmlFor="fileName"
                            className="block text-sm font-medium text-gray-700"
                          >
                            File Name
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="fileName"
                              value={fileName}
                              onChange={(e) => setFileName(e.target.value)}
                              placeholder="e.g., index.html, main.js, styles.css"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              autoFocus
                            />
                          </div>
                          {parentPath && (
                            <p className="mt-1 text-xs text-gray-500">
                              Will be created in: {parentPath}/
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="fileContent"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Initial Content (optional)
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="fileContent"
                              rows={10}
                              value={fileContent}
                              onChange={(e) => setFileContent(e.target.value)}
                              placeholder="Enter initial file content..."
                              className="block w-full rounded-md border-gray-300 font-mono text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    disabled={!fileName.trim() || isCreating}
                    onClick={() => void handleCreate()}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto"
                  >
                    {isCreating ? "Creating..." : "Create File"}
                  </button>
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={handleClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
