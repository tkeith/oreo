import { createCallerFactory, createTRPCRouter } from "~/server/trpc/main";
import { authRouter } from "~/server/trpc/routers/auth";
import { projectsRouter } from "~/server/trpc/routers/projects";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
