import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { createVFSFromTemplate, serialize } from "~/server/utils/vfs";
import { createVm, setupVm } from "~/server/freestyle-api";
import fs from "fs";
import path from "path";

const TemplateSchema = z.record(z.string(), z.string());

export const createProject = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(1).max(100),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await verifyToken(input.token);

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Load Convex template from JSON file
    const templatePath = path.join(
      process.cwd(),
      "convex-codebase-template.json",
    );
    const templateData = fs.readFileSync(templatePath, "utf-8");
    const convexTemplate = TemplateSchema.parse(JSON.parse(templateData));

    // Create VFS from the Convex template
    const vfs = createVFSFromTemplate(convexTemplate);
    const serializedVFS = serialize(vfs);

    const project = await db.project.create({
      data: {
        name: input.name,
        userId: user.id,
        vfs: serializedVFS,
      },
    });

    // Start VM creation in background
    void (async () => {
      try {
        await db.project.update({
          where: { id: project.id },
          data: { vmStatus: "creating" },
        });
        const vm = await createVm();
        await setupVm(vm.id);
        await db.project.update({
          where: { id: project.id },
          data: { vmId: vm.id, vmStatus: "ready" },
        });
      } catch (error) {
        await db.project.update({
          where: { id: project.id },
          data: {
            vmStatus: "failed",
            vmError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    })();

    return project;
  });
