import { createTRPCRouter } from "~/server/trpc/main";
import { getGoogleClientId } from "~/server/trpc/procedures/get-google-client-id";
import { googleLogin } from "~/server/trpc/procedures/google-login";
import { getUser } from "~/server/trpc/procedures/get-user";

export const authRouter = createTRPCRouter({
  getGoogleClientId,
  googleLogin,
  getUser,
});
