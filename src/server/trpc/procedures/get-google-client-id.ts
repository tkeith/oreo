import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getGoogleClientId = baseProcedure.query(() => {
  return env.GOOGLE_CLIENT_ID;
});
