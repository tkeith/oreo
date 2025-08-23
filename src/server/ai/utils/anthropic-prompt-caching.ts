/**
 * Utility for managing cache control blocks in messages for Anthropic's prompt caching
 */

import type { ModelMessage } from "ai";
import lodash from "lodash";

/**
 * Maximum number of blocks that can have cache control enabled
 * per Anthropic's API limitations
 */
const MAX_CACHE_CONTROL_BLOCKS = 4;

/**
 * Updates messages to add cache control to the last block and ensures
 * we don't exceed the maximum number of cache control blocks.
 *
 * This function:
 * 1. Adds cache control to the last message or content block
 * 2. Counts total blocks with cache control
 * 3. If there are more than 4 blocks with cache control (Anthropic's limit),
 *    removes cache control from the earliest blocks to stay within the limit
 * 4. Uses lodash.merge for deep merging to preserve existing provider options
 *
 * @param messages - The messages to update
 * @returns Updated messages with proper cache control
 */
export function updateMessagesForCaching(
  messages: ModelMessage[],
): ModelMessage[] {
  if (messages.length === 0) {
    return messages;
  }

  // Deep clone messages to avoid mutations
  const updatedMessages = structuredClone(messages);

  // Add cache control to the last message/content block
  const lastMessage = updatedMessages[updatedMessages.length - 1];
  if (!lastMessage) {
    return updatedMessages;
  }

  // Add cache control to the last block
  if (typeof lastMessage.content === "string") {
    // For string content, add cache control to the message itself
    lastMessage.providerOptions = lodash.merge(
      {},
      lastMessage.providerOptions,
      {
        anthropic: {
          cacheControl: {
            type: "ephemeral",
          },
        },
      },
    );
  } else if (
    Array.isArray(lastMessage.content) &&
    lastMessage.content.length > 0
  ) {
    // For array content, add cache control to the last content block
    const lastContentBlock =
      lastMessage.content[lastMessage.content.length - 1]!;
    lastContentBlock.providerOptions = lodash.merge(
      {},
      lastContentBlock.providerOptions,
      {
        anthropic: {
          cacheControl: {
            type: "ephemeral",
          },
        },
      },
    );
  } else {
    throw new Error(
      `Last content block is not string or non-empty array: ${JSON.stringify(lastMessage, null, 2)}`,
    );
  }

  // Count total blocks with cache control
  const cacheControlBlocks = countCacheControlBlocks(updatedMessages);

  // If we exceed the limit, remove cache control from the earliest blocks
  if (cacheControlBlocks > MAX_CACHE_CONTROL_BLOCKS) {
    const blocksToRemove = cacheControlBlocks - MAX_CACHE_CONTROL_BLOCKS;
    removeCacheControlFromEarliestBlocks(updatedMessages, blocksToRemove);
  }

  return updatedMessages;
}

/**
 * Counts the total number of blocks with cache control across all messages
 */
function countCacheControlBlocks(messages: ModelMessage[]): number {
  let count = 0;

  for (const message of messages) {
    // Check if the message itself has cache control
    if (hasCacheControl(message.providerOptions)) {
      count++;
    }

    // Check content blocks if content is an array
    if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (hasCacheControl(block.providerOptions)) {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Removes cache control from the earliest blocks with cache control
 *
 * @param messages - Messages to update
 * @param numToRemove - Number of cache control blocks to remove
 */
function removeCacheControlFromEarliestBlocks(
  messages: ModelMessage[],
  numToRemove: number,
): void {
  let removed = 0;

  // Iterate through messages from the beginning
  for (const message of messages) {
    if (removed >= numToRemove) {
      break;
    }

    // Check and potentially remove from message level
    if (hasCacheControl(message.providerOptions)) {
      removeCacheControl(message.providerOptions);
      removed++;
      if (removed >= numToRemove) {
        break;
      }
    }

    // Check and potentially remove from content blocks
    if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (removed >= numToRemove) {
          break;
        }

        if (hasCacheControl(block.providerOptions)) {
          removeCacheControl(block.providerOptions);
          removed++;
        }
      }
    }
  }
}

/**
 * Checks if an options object has cache control enabled
 */
function hasCacheControl(
  providerOptions:
    | undefined
    | {
        anthropic?: { cacheControl?: { type: string } };
      },
): boolean {
  return providerOptions?.anthropic?.cacheControl?.type === "ephemeral";
}

/**
 * Removes cache control from an object's provider options
 */
function removeCacheControl(
  providerOptions:
    | undefined
    | {
        anthropic?: { cacheControl?: { type: string } };
      },
): void {
  if (!providerOptions) {
    throw new Error(`Provider options are undefined`);
  }

  const anthropicOptions = providerOptions.anthropic;
  if (anthropicOptions?.cacheControl?.type !== "ephemeral") {
    throw new Error(
      `Cache control is not enabled: ${JSON.stringify(providerOptions, null, 2)}`,
    );
  }

  delete anthropicOptions.cacheControl;
}
