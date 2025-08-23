import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";

export const getVmUrl = baseProcedure
  .input(z.object({ token: z.string(), projectId: z.string() }))
  .query(async ({ input }) => {
    const user = await verifyToken(input.token);
    if (!user) throw new Error("Unauthorized");

    const project = await db.project.findFirst({
      where: { id: input.projectId, userId: user.id },
    });

    // Only return URL if app is running
    const vmUrl =
      project?.vmId && project?.appRunning
        ? `https://${project.vmId}.vm.freestyle.sh`
        : null;

    return {
      vmUrl,
      appRunning: project?.appRunning ?? false,
      hasDeployed: !!project?.vmId,
    };
  });
