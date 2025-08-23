import { EyeIcon } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/auth-store";

export function PreviewPane({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);

  const { data, refetch } = useQuery(
    trpc.projects.getVmUrl.queryOptions(
      { token: token || "", projectId },
      { enabled: !!token, refetchInterval: 3000 },
    ),
  );

  useEffect(() => {
    const interval = setInterval(() => void refetch(), 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <>
      <div className="flex items-center border-b border-gray-200 px-6 py-4">
        <EyeIcon className="mr-2 h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {data?.vmUrl ? (
          <iframe src={data.vmUrl} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                App not running
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Deploy your project to see a preview
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
