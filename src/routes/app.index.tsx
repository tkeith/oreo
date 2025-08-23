import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/auth-store";

export const Route = createFileRoute("/app/")({
  component: AppHomePage,
});

function AppHomePage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectName, setProjectName] = useState("");

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
        setShowCreateForm(false);
        setProjectName("");
        void refetch();
      },
      onError: (error) => {
        console.error("Failed to create project:", error);
      },
    }),
  );

  const handleCreateProject = () => {
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              New Project
            </button>
          ) : (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Create New Project
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="project-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter project name"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateProject}
                    disabled={
                      !projectName.trim() || createProjectMutation.isPending
                    }
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createProjectMutation.isPending
                      ? "Creating..."
                      : "Create Project"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setProjectName("");
                    }}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

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
