import { createCallerFactory, createTRPCRouter } from "~/server/trpc/main";
import { authRouter } from "~/server/trpc/routers/auth";

export const appRouter = createTRPCRouter({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
