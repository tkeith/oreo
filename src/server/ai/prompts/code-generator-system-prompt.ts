import fs from "fs";

export function getCodeGeneratorSystemPrompt() {
  return fs
    .readFileSync(
      "src/server/ai/prompts/code-generator-system-prompt.md",
      "utf8",
    )
    .replaceAll(
      "{{CONVEX_RULES}}",
      fs.readFileSync("src/server/ai/prompts/convex-rules.md", "utf8"),
    );
}
