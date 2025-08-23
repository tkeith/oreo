import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { createVFS, serialize } from "~/server/utils/vfs";

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

    // Create and serialize a new empty VFS
    const vfs = createVFS();
    const serializedVFS = serialize(vfs);

    const project = await db.project.create({
      data: {
        name: input.name,
        userId: user.id,
        vfs: serializedVFS,
      },
    });

    return project;
  });
