import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/auth-store";

export const Route = createFileRoute("/app/projects/$projectId/")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId } = Route.useParams();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);

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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to Projects
          </button>

          <div className="rounded-lg bg-white p-6 shadow">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              {project.name}
            </h1>
            <div className="text-sm text-gray-500">
              <span>
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Project Overview
            </h3>
            <p className="text-sm text-gray-600">
              This is a placeholder for your project overview. You can add more
              details about your project here.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600">
              Recent activity and updates will appear here once the feature is
              implemented.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-600">
              Quick actions and shortcuts for your project will be available
              here.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-8 rounded-lg bg-white p-8 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Project Content
          </h2>
          <div className="prose max-w-none text-gray-600">
            <p>
              This is the main content area for your project. Future features
              and functionality will be added here.
            </p>
            <p className="mt-4">You can use this space to:</p>
            <ul className="mt-2 space-y-2">
              <li>• Manage project resources</li>
              <li>• Track project progress</li>
              <li>• Collaborate with team members</li>
              <li>• Store project documentation</li>
              <li>• Monitor project metrics</li>
            </ul>
            <p className="mt-4">Stay tuned for more features coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
