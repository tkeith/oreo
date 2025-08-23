import { z } from "zod";
import JSZip from "jszip";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize } from "~/server/utils/vfs";

export const downloadVfsZip = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await verifyToken(input.token);
    if (!user) throw new Error("Unauthorized");

    const project = await db.project.findFirst({
      where: { id: input.projectId, userId: user.id },
    });
    if (!project) throw new Error("Project not found");

    const vfs = deserialize(project.vfs);
    if (!vfs) throw new Error("Invalid VFS data");

    // Create zip
    const zip = new JSZip();
    Object.entries(vfs.filesContents).forEach(([path, content]) => {
      zip.file(path, content);
    });

    // Generate base64 zip
    const base64 = await zip.generateAsync({ type: "base64" });
    return { base64, projectName: project.name };
  });
