import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useIsAuthenticated } from "~/stores/auth-store";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <img
          src="/oreo-logo.png"
          alt="Oreo"
          className="mx-auto mb-6 h-24 w-auto object-contain"
        />
        <h1 className="mb-6 text-5xl font-bold text-gray-900">
          Welcome to Oreo
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Your AI-powered coding assistant
        </p>
        <button
          onClick={() =>
            void navigate({ to: isAuthenticated ? "/app" : "/login" })
          }
          className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {isAuthenticated ? "Go to App" : "Sign In"}
        </button>
      </div>
    </div>
  );
}
