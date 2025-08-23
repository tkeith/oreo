import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "./env";
import { db } from "./db";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const tokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string(),
});

export async function verifyToken(token: string) {
  try {
    const verified = jwt.verify(token, env.JWT_TOKEN);
    const parsed = tokenPayloadSchema.parse(verified);

    // Get the user from database
    const user = await db.user.findUnique({
      where: { id: parsed.userId },
    });

    return user;
  } catch (error) {
    return null;
  }
}

export async function createToken(userId: string, email: string) {
  // Create JWT token that expires in 30 days
  const token = jwt.sign({ userId, email }, env.JWT_TOKEN, {
    expiresIn: "30d",
  });

  return token;
}

export async function verifyGoogleToken(credential: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid Google token");
    }

    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name || null,
      picture: payload.picture || null,
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw new Error("Invalid Google token");
  }
}
