import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "~/server/auth";
import { db } from "~/server/db";
import { deserialize, serialize, listFiles } from "~/server/utils/vfs";
import { runAgent } from "~/server/ai/chatAgent";
import { runCodeGenerator } from "~/server/ai/codeGeneratorAgent";
import { deployToVm } from "~/server/ai/deploy-to-vm";
import { ModelMessage } from "ai";
import type { ChatEvent } from "~/types/chat";

export const sendChatMessage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      projectId: z.string(),
      message: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await verifyToken(input.token);

    if (!user) {
      throw new Error("Unauthorized");
    }

    const project = await db.project.findFirst({
      where: {
        id: input.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Check if already processing
    if (project.isProcessing) {
      throw new Error("Agent is already processing a request");
    }

    // Set processing flag
    await db.project.update({
      where: { id: input.projectId },
      data: { isProcessing: true },
    });

    // Run the agent in the background
    void (async () => {
      try {
        const vfs = deserialize(project.vfs);
        if (!vfs) {
          throw new Error("Invalid VFS data");
        }

        const files = listFiles(vfs);

        // Parse existing chat history or initialize empty array
        let chatHistory: ModelMessage[] = [];
        try {
          chatHistory = JSON.parse(
            project.chatHistory || "[]",
          ) as ModelMessage[];
        } catch (error) {
          console.error("Failed to parse chat history:", error);
          chatHistory = [];
        }

        // Parse existing agent events or initialize empty array
        let agentEvents: ChatEvent[] = [];
        try {
          agentEvents = JSON.parse(project.agentEvents || "[]") as ChatEvent[];
        } catch (error) {
          console.error("Failed to parse agent events:", error);
          agentEvents = [];
        }

        // Run the AI agent with chat history
        const agentResult = await runAgent(input.message, {
          projectVfs: vfs,
          projectFiles: files,
          messages: chatHistory,
          projectId: input.projectId,
          onStateUpdate: () => {
            db.project
              .update({
                where: { id: input.projectId },
                data: {
                  chatHistory: JSON.stringify(chatHistory),
                  vfs: serialize(vfs),
                },
              })
              .catch((error) => {
                console.error("Failed to update project:", error);
              });
          },
          onEventEmit: (events) => {
            // Append new events to agentEvents array
            agentEvents.push(...events);

            // Save to database
            db.project
              .update({
                where: { id: input.projectId },
                data: {
                  agentEvents: JSON.stringify(agentEvents),
                },
              })
              .catch((error) => {
                console.error("Failed to update agent events:", error);
              });
          },
        });

        // If spec was modified, run code generator automatically
        if (agentResult.specModified) {
          agentEvents.push({
            eventType: "toolCall",
            markdown: `**Running code generator**`,
            timestamp: Date.now(),
            agent: "chat",
          });

          const { response: codeGeneratorResponse } = await runCodeGenerator({
            projectVfs: vfs,
            onStateUpdate: () => {
              db.project
                .update({
                  where: { id: input.projectId },
                  data: {
                    vfs: serialize(vfs),
                  },
                })
                .catch((error) => {
                  console.error("Failed to update project:", error);
                });
            },
            onEventEmit: (events) => {
              agentEvents.push(...events);
              db.project
                .update({
                  where: { id: input.projectId },
                  data: {
                    agentEvents: JSON.stringify(agentEvents),
                  },
                })
                .catch((error) => {
                  console.error("Failed to update agent events:", error);
                });
            },
          });

          agentEvents.push({
            eventType: "toolResult",
            markdown: codeGeneratorResponse,
            timestamp: Date.now(),
            agent: "chat",
          });

          // Deploy after code generation
          agentEvents.push({
            eventType: "toolCall",
            markdown: `**Starting deployment to VM**`,
            timestamp: Date.now(),
            agent: "chat",
          });

          // Update events and set appRunning to false before deployment (app will be inaccessible)
          await db.project.update({
            where: { id: input.projectId },
            data: {
              agentEvents: JSON.stringify(agentEvents),
              appRunning: false,
            },
          });

          let deploymentSuccessful = false;
          try {
            // Deploy with event handler that immediately pushes events
            const deployResult = await deployToVm(
              input.projectId,
              vfs,
              async (message) => {
                // Push each deployment event immediately
                agentEvents.push({
                  eventType: "toolResult",
                  markdown: message,
                  timestamp: Date.now(),
                  agent: "chat",
                });

                // Update database immediately with new event
                await db.project.update({
                  where: { id: input.projectId },
                  data: {
                    agentEvents: JSON.stringify(agentEvents),
                  },
                });
              },
            );

            deploymentSuccessful = true;

            agentEvents.push({
              eventType: "toolResult",
              markdown: deployResult,
              timestamp: Date.now(),
              agent: "chat",
            });
          } catch (error) {
            // Log deployment error
            agentEvents.push({
              eventType: "toolResult",
              markdown: `Deployment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
              timestamp: Date.now(),
              agent: "chat",
            });
          } finally {
            // Set appRunning to true only if deployment was successful
            await db.project.update({
              where: { id: input.projectId },
              data: {
                agentEvents: JSON.stringify(agentEvents),
                appRunning: deploymentSuccessful,
              },
            });
          }
        }

        // Clear processing flag when done
        await db.project.update({
          where: { id: input.projectId },
          data: { isProcessing: false },
        });
      } catch (error) {
        console.error("Agent processing error:", error);
        // Clear processing flag on error
        await db.project.update({
          where: { id: input.projectId },
          data: { isProcessing: false },
        });
      }
    })();

    return {
      success: true,
      message: "Processing started",
    };
  });
