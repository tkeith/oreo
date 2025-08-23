import { GoogleOAuthProvider } from "@react-oauth/google";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";

export function GoogleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const trpc = useTRPC();
  const { data: clientId } = useQuery(
    trpc.auth.getGoogleClientId.queryOptions(),
  );

  if (!clientId) {
    return <div>Loading authentication...</div>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  );
}
