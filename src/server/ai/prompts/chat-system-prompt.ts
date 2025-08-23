import fs from "fs";
import { getSpecStructure } from "./spec-structure";
import { increaseMarkdownHeaderLevels } from "~/utils/markdown-utils";

export function getChatSystemPrompt() {
  return fs
    .readFileSync("src/server/ai/prompts/chat-system-prompt.md", "utf8")
    .replaceAll(
      "{{SPEC_STRUCTURE}}",
      increaseMarkdownHeaderLevels(getSpecStructure()),
    );
}
