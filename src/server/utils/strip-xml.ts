// Tags to strip from messages
const TAGS_TO_STRIP = ["additional-context"];

/**
 * Strips specified XML tags and their content from a string
 */
export function stripXmlTags(content: string): string {
  let result = content;

  for (const tag of TAGS_TO_STRIP) {
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;

    let startIndex = result.indexOf(openTag);
    while (startIndex !== -1) {
      const endIndex = result.indexOf(closeTag, startIndex);
      if (endIndex !== -1) {
        result =
          result.slice(0, startIndex) +
          result.slice(endIndex + closeTag.length);
      } else {
        break;
      }
      startIndex = result.indexOf(openTag);
    }
  }

  return result.trim();
}
