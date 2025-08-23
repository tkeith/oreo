import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";

// Model configurations that can be spread directly into generateText

export const GEMINI_CONFIG = {
  model: google("gemini-2.5-pro"),
  temperature: 1,
} as const;

export const CLAUDE_CONFIG = {
  model: anthropic("claude-sonnet-4-20250514"),
  providerOptions: {
    anthropic: {
      thinking: { type: "enabled", budgetTokens: 4000 },
    } satisfies AnthropicProviderOptions,
  },
  headers: {
    "anthropic-beta": "interleaved-thinking-2025-05-14,context-1m-2025-08-07",
  },
  maxTokens: 16000,
  temperature: 1.0,
} as const;
