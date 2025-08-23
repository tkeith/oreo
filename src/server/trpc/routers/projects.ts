import { createTRPCRouter } from "~/server/trpc/main";
import { createProject } from "~/server/trpc/procedures/create-project";
import { listProjects } from "~/server/trpc/procedures/list-projects";
import { getProject } from "~/server/trpc/procedures/get-project";

export const projectsRouter = createTRPCRouter({
  create: createProject,
  list: listProjects,
  get: getProject,
});
