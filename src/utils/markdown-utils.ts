/**
 * Increases the header level of every header in a markdown file.
 * Headers are identified by:
 * - Being at the beginning of the file OR preceded by a blank line
 * - Starting with one or more # followed by a space
 * - Followed by a blank line (or end of file)
 */
export function increaseMarkdownHeaderLevels(markdown: string): string {
  const lines = markdown.split("\n");
  return lines
    .map((line, i) => {
      if (!/^#+\s/.test(line)) return line;
      const isStart = i === 0 || lines[i - 1]?.trim() === "";
      const isEnd = i === lines.length - 1 || lines[i + 1]?.trim() === "";
      return isStart && isEnd ? "#" + line : line;
    })
    .join("\n");
}
