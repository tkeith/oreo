import fs from "fs";
import { getSpecStructure } from "./spec-structure";
import { increaseMarkdownHeaderLevels } from "~/utils/markdown-utils";

export function getBuilderSystemPrompt() {
  return fs
    .readFileSync("src/server/ai/prompts/builder-system-prompt.md", "utf8")
    .replaceAll(
      "{{SPEC_STRUCTURE}}",
      increaseMarkdownHeaderLevels(getSpecStructure()),
    );
}
