import assert from "assert";
import { env } from "../env";

export function getBaseUrl({ port }: { port?: number } = {}): string {
  if (port === undefined || port === 8000) {
    // it's the primary port
    return env.BASE_URL ?? "http://localhost:8000";
  }

  // it's a secondary port

  if (env.BASE_URL_OTHER_PORT) {
    return env.BASE_URL_OTHER_PORT.replace("[PORT]", port.toString());
  }

  const primaryBaseUrl = getBaseUrl();
  if (primaryBaseUrl.startsWith("http://")) {
    // it's an http url, so replace the port
    return `${primaryBaseUrl.split("://")[0]}://${primaryBaseUrl.split("://")[1]!.split(":")[0]}:${port}`;
  }

  // it's an https url, so replace the subdomain with subdomain--port
  assert(primaryBaseUrl.startsWith("https://"));
  const primaryBaseUrlParts = primaryBaseUrl.split(".");
  return `${primaryBaseUrlParts[0]}--${port}.${primaryBaseUrlParts.slice(1).join(".")}`;
}
