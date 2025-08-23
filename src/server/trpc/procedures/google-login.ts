import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { createToken, verifyGoogleToken } from "~/server/auth";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export const googleLogin = baseProcedure
  .input(
    z.object({
      credential: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      // Verify the Google token
      const googleUser = await verifyGoogleToken(input.credential);

      // Find or create the user
      let user = await db.user.findUnique({
        where: { googleId: googleUser.googleId },
      });

      if (!user) {
        // Create new user
        user = await db.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
        });
      } else {
        // Update user info if changed
        user = await db.user.update({
          where: { id: user.id },
          data: {
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
        });
      }

      // Create JWT token
      const token = await createToken(user.id, user.email);

      return { token };
    } catch (error) {
      console.error("Google login error:", error);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Failed to authenticate with Google",
      });
    }
  });
