import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  component: AppHomePage,
});

function AppHomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl p-6">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Hello World!
          </h1>
          <p className="text-lg text-gray-600">
            Welcome to your authenticated app.
          </p>
        </div>
      </div>
    </div>
  );
}
