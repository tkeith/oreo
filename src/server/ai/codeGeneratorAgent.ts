import { generateText, ModelMessage, stepCountIs } from "ai";
import * as vfs from "~/server/utils/vfs";
import { CLAUDE_CONFIG } from "./constants";
import { updateMessagesForCaching } from "./utils/anthropic-prompt-caching";
import { createVFSTools } from "./vfs-tools";
import { getCodeGeneratorSystemPrompt } from "./prompts/code-generator-system-prompt";
import { stepToEvents, type ChatEvent } from "~/types/chat";
import {
  getProjectVmId,
  stopAndCopyCode,
  runSetup,
  verifyCode,
  launchApp,
  type DeploymentEventHandler,
} from "./deploy-to-vm";

interface CodeGeneratorContext {
  projectVfs: vfs.VFS;
  projectId?: string;
  onStateUpdate?: () => void;
  onEventEmit?: (events: ChatEvent[]) => void;
  deployAfterGeneration?: boolean;
}

export async function runCodeGenerator(
  context: CodeGeneratorContext,
): Promise<{ response: string; deployUrl?: string }> {
  const messages: ModelMessage[] = [
    {
      role: "system",
      content: getCodeGeneratorSystemPrompt(),
    },
    {
      role: "user",
      content:
        "The spec has been updated. Make sure the code matches the spec.",
    },
  ];

  // Generate code
  const result = await generateText({
    ...CLAUDE_CONFIG,
    stopWhen: stepCountIs(50),
    messages,
    tools: createVFSTools(context.projectVfs), // Unrestricted access
    onStepFinish(stepResult) {
      // Emit events for this step
      const events = stepToEvents(stepResult, "codeGenerator");
      if (events.length > 0) {
        context.onEventEmit?.(events);
      }
      // Trigger database update after each step
      context.onStateUpdate?.();
    },
    prepareStep: ({ messages }) => {
      updateMessagesForCaching(messages);
      return {
        messages,
      };
    },
  });

  // Deploy if requested
  let deployUrl: string | undefined;
  if (context.deployAfterGeneration && context.projectId) {
    const deployResult = await deployWithVerification(
      context.projectId,
      context.projectVfs,
      context.onEventEmit,
      context.onStateUpdate,
    );
    deployUrl = deployResult.url;
  }

  return {
    response: result.text,
    deployUrl,
  };
}

async function deployWithVerification(
  projectId: string,
  projectVfs: vfs.VFS,
  onEventEmit?: (events: ChatEvent[]) => void,
  onStateUpdate?: () => void,
): Promise<{ url: string }> {
  const vmId = await getProjectVmId(projectId);
  if (!vmId) throw new Error("VM not found for project");

  const eventHandler: DeploymentEventHandler = async (message) => {
    if (onEventEmit) {
      onEventEmit([
        {
          eventType: "toolResult",
          markdown: message,
          timestamp: Date.now(),
          agent: "codeGenerator",
        },
      ]);
    }
    onStateUpdate?.();
  };

  // Step 1: Stop and copy code
  await stopAndCopyCode(vmId, projectVfs, { onEvent: eventHandler });

  // Step 2: Run setup
  await runSetup(vmId, { onEvent: eventHandler });

  // Step 3: Verify and fix errors (up to 5 attempts)
  let verifyAttempts = 0;
  const maxVerifyAttempts = 5;

  while (verifyAttempts < maxVerifyAttempts) {
    verifyAttempts++;

    const verifyResult = await verifyCode(vmId, { onEvent: eventHandler });

    if (verifyResult.success) {
      break;
    }

    if (verifyAttempts >= maxVerifyAttempts) {
      await eventHandler(
        `⚠️ Code verification failed after ${maxVerifyAttempts} attempts. Continuing with deployment...`,
      );
      break;
    }

    // Fix linting errors
    await eventHandler(
      `🔧 Attempting to fix linting errors (attempt ${verifyAttempts}/${maxVerifyAttempts})...`,
    );

    const fixedCode = await fixLintingErrors(
      projectVfs,
      verifyResult,
      onEventEmit,
      onStateUpdate,
    );

    if (!fixedCode) {
      await eventHandler(
        "⚠️ Unable to fix errors. Continuing with deployment...",
      );
      break;
    }

    // Re-upload fixed code
    await stopAndCopyCode(vmId, projectVfs, { onEvent: eventHandler });
  }

  // Step 4: Launch app
  const url = await launchApp(vmId, { onEvent: eventHandler });

  return { url };
}

async function fixLintingErrors(
  projectVfs: vfs.VFS,
  verifyResult: { stdout: string; stderr: string; statusCode: number },
  onEventEmit?: (events: ChatEvent[]) => void,
  onStateUpdate?: () => void,
): Promise<boolean> {
  const messages: ModelMessage[] = [
    {
      role: "system",
      content: getCodeGeneratorSystemPrompt(),
    },
    {
      role: "user",
      content: `The linting check failed with the following error:

Exit code: ${verifyResult.statusCode}

Standard output:
${verifyResult.stdout}

Standard error:
${verifyResult.stderr}

Please fix the linting errors in the code. Only fix the errors shown above, don't make other changes.`,
    },
  ];

  try {
    await generateText({
      ...CLAUDE_CONFIG,
      stopWhen: stepCountIs(10), // Limit steps for fixing
      messages,
      tools: createVFSTools(projectVfs),
      onStepFinish(stepResult) {
        const events = stepToEvents(stepResult, "codeGenerator");
        if (events.length > 0) {
          onEventEmit?.(events);
        }
        onStateUpdate?.();
      },
      prepareStep: ({ messages }) => {
        updateMessagesForCaching(messages);
        return { messages };
      },
    });

    return true;
  } catch (error) {
    console.error("Error fixing linting errors:", error);
    return false;
  }
}
