import { db } from "~/server/db";
import { execAwait } from "~/server/freestyle-api";
import * as vfs from "~/server/utils/vfs";

export async function deployToVm(
  projectId: string,
  projectVfs: vfs.VFS,
): Promise<string> {
  // Wait for VM to be ready (max 120 seconds)
  let project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return "Project not found";

  const maxWait = 120;
  for (let i = 0; i < maxWait && project?.vmStatus === "creating"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    project = await db.project.findUnique({ where: { id: projectId } });
  }

  if (project?.vmStatus === "failed" || !project?.vmId) {
    return "VM creation failed";
  }

  const vmId = project.vmId;

  // Kill existing processes and screen sessions
  await execAwait(vmId, "screen -S convex-dev -X quit || true");
  await execAwait(vmId, "pkill -f 'pnpm dev' || true");
  await execAwait(vmId, "pkill -f 'node' || true");
  await execAwait(vmId, "pkill -f 'convex' || true");
  // await execAwait(vmId, "pkill -f 'socat' || true");
  await execAwait(vmId, "rm -rf /app/*");

  const files = vfs.listFiles(projectVfs).filter((f) => f.startsWith("code/"));
  let script = "#!/bin/bash\nmkdir -p /app\n";
  for (const file of files) {
    const content = vfs.readFile(projectVfs, file);
    const targetPath = file.replace(/^code\//, "");
    const dir = targetPath.substring(0, targetPath.lastIndexOf("/"));
    if (dir) script += `mkdir -p /app/${dir}\n`;
    script += `cat > /app/${targetPath} << 'EOF'\n${content}\nEOF\n`;
  }

  await execAwait(vmId, script);
  await execAwait(vmId, "cd /app && pnpm install");
  // Run pnpm dev inside a detached screen session to provide TTY
  await execAwait(
    vmId,
    "screen -dmS convex-dev bash -c 'cd /app && CONVEX_AGENT_MODE=anonymous pnpm dev'",
  );
  // await execAwait(vmId, "socat TCP-LISTEN:3000,fork TCP:localhost:5173 &");

  return `Deployed to https://${vmId}.vm.freestyle.sh`;
}
