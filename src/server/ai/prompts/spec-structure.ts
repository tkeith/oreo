import fs from "fs";

export function getSpecStructure() {
  return fs.readFileSync("src/server/ai/prompts/spec-structure.md", "utf8");
}
