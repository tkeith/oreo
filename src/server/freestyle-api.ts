import { z } from "zod";
import { env } from "./env";

const createVmResponseSchema = z.object({
  short_id: z.string(),
});

const execAwaitResponseSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  status_code: z.number().nullable().optional(),
});

export const createVm = async () => {
  const res = await fetch(`${env.FREESTYLE_API_URL}/vms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workdir: "/" }),
  });
  const data = createVmResponseSchema.parse(await res.json());
  return { id: data.short_id };
};

export const execAwait = async (vmId: string, command: string) => {
  const res = await fetch(`${env.FREESTYLE_API_URL}/vms/${vmId}/exec-await`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  return execAwaitResponseSchema.parse(await res.json());
};

export const setupVm = async (vmId: string) => {
  await execAwait(
    vmId,
    "apt update && apt install --yes socat && npm i -g pnpm",
  );
};
