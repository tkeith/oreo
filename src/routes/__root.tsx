import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { TRPCReactProvider } from "~/trpc/react";
import { GoogleAuthProvider } from "~/components/google-auth-provider";
import { Toaster } from "react-hot-toast";
import { LoadingScreen } from "~/components/loading-screen";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  if (isFetching) {
    return <LoadingScreen />;
  }

  return (
    <TRPCReactProvider>
      <GoogleAuthProvider>
        <Outlet />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#333",
              color: "#fff",
            },
            success: {
              style: {
                background: "#10b981",
              },
            },
            error: {
              style: {
                background: "#ef4444",
              },
            },
          }}
        />
      </GoogleAuthProvider>
    </TRPCReactProvider>
  );
}
