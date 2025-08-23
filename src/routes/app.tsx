import {
  createFileRoute,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useIsAuthenticated } from "~/stores/auth-store";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import { useEffect } from "react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();

  // Check if we're on a project page
  const isProjectPage = location.pathname.includes("/app/projects/");

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  // Don't show header/footer on project pages
  if (isProjectPage) {
    return <Outlet />;
  }

  // Regular app layout with header/footer
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
