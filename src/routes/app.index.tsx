import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/auth-store";
import { CreateProjectModal } from "~/components/create-project-modal";

export const Route = createFileRoute("/app/")({
  component: AppHomePage,
});

function AppHomePage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch projects
  const {
    data: projects,
    isLoading,
    refetch,
  } = useQuery(
    trpc.projects.list.queryOptions(
      { token: token ?? "" },
      { enabled: !!token },
    ),
  );

  // Create project mutation
  const createProjectMutation = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: () => {
        setShowCreateModal(false);
        void refetch();
      },
      onError: (error) => {
        console.error("Failed to create project:", error);
      },
    }),
  );

  const handleCreateProject = (projectName: string) => {
    if (!token || !projectName.trim()) return;

    createProjectMutation.mutate({
      token,
      name: projectName,
    });
  };

  const navigateToProject = (projectId: string) => {
    void navigate({ to: `/app/projects/$projectId`, params: { projectId } });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 py-12">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
          <p className="mt-2 text-gray-600">
            Manage and organize your projects in one place
          </p>
        </div>

        {/* Create Project Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            New Project
          </button>
        </div>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onConfirm={handleCreateProject}
          isCreating={createProjectMutation.isPending}
        />

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigateToProject(project.id)}
                className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
                <div className="text-xs text-gray-500">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white py-12 text-center">
            <p className="mb-4 text-gray-500">No projects yet</p>
            <p className="text-sm text-gray-400">
              Click "New Project" to create your first project
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
