import { z } from "zod";
import { env } from "./env";

const createVmResponseSchema = z.object({
  id: z.string(),
});

const execAwaitResponseSchema = z.object({
  stdout: z
    .string()
    .nullable()
    .transform((val) => val ?? ""),
  stderr: z
    .string()
    .nullable()
    .transform((val) => val ?? ""),
  statusCode: z
    .number()
    .nullable()
    .transform((val) => val ?? 0),
});

export const createVm = async () => {
  const res = await fetch(`${env.FREESTYLE_API_URL}/vms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workdir: "/" }),
  });
  const resJson = (await res.json()) as unknown;
  try {
    const data = createVmResponseSchema.parse(resJson);
    return { id: data.id };
  } catch (error) {
    throw new Error(
      `failed to parse create VM response (${JSON.stringify(resJson)}) - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const execAwait = async (vmId: string, command: string) => {
  const res = await fetch(`${env.FREESTYLE_API_URL}/vms/${vmId}/exec-await`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  const resJson = (await res.json()) as unknown;
  try {
    return execAwaitResponseSchema.parse(resJson);
  } catch (error) {
    throw new Error(
      `failed to parse execAwait response (${JSON.stringify(resJson)}) - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const setupVm = async (vmId: string) => {
  await execAwait(
    vmId,
    "apt update && apt install --yes nginx screen && npm i -g pnpm",
  );
};
