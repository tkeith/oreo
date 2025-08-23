import * as shlex from "shlex";

/**
 * ALWAYS use this when passing strings to shell commands.
 */
export function shquote(rawInput: string): string {
  return shlex.quote(rawInput);
}

/**
 * Returns a script that prints the given content to stdout.
 * echo doesn't work for this as it seems impossible for the content "-e" to be printed.
 * (it doesn't work even with: x="-e"; echo "$x")
 */
export function getScriptPrint(content: string) {
  return `( printf '%s' ${shquote(content)} )`;
}

/**
 * get a script to save text to a file
 */
export function getWriteFileScript(filename: string, content: string): string {
  return `${getScriptPrint(content)} > ${shquote(filename)}`;
}
