import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { ModelMessage } from "ai";
import { stripXmlTags } from "~/server/utils/strip-xml";
import { contentPartToEvent, type ChatEvent } from "~/types/chat";

export const getChatHistory = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await verifyToken(input.token);

    if (!user) {
      throw new Error("Unauthorized");
    }

    const project = await db.project.findFirst({
      where: {
        id: input.projectId,
        userId: user.id,
      },
      select: {
        chatHistory: true,
        isProcessing: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Parse chat history
    let messages: ModelMessage[] = [];
    try {
      messages = JSON.parse(project.chatHistory || "[]") as ModelMessage[];
    } catch (error) {
      console.error("Failed to parse chat history:", error);
      messages = [];
    }

    // Convert messages to events for client display
    const events: ChatEvent[] = [];

    for (const message of messages) {
      if (message.role === "system") continue; // Skip system messages

      if (typeof message.content === "string") {
        // Simple string content
        const cleanText = stripXmlTags(message.content);
        if (cleanText) {
          events.push({
            eventType: message.role === "user" ? "userMessage" : "aiMessage",
            markdown: cleanText,
          });
        }
      } else if (Array.isArray(message.content)) {
        // Array of content parts - each becomes a separate event
        for (const part of message.content) {
          // Strip XML from text parts before processing
          let processedPart: unknown = part;
          if (typeof part === "object" && part !== null && "type" in part) {
            const typedPart = part as unknown as Record<string, unknown>;
            if (
              typedPart.type === "text" &&
              typeof typedPart.text === "string"
            ) {
              processedPart = {
                ...typedPart,
                text: stripXmlTags(typedPart.text),
              };
            }
          }

          const event = contentPartToEvent(processedPart, message.role);
          if (event && event.markdown) {
            events.push(event);
          }
        }
      }
    }

    return {
      events,
      isProcessing: project.isProcessing,
    };
  });
