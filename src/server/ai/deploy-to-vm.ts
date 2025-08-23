import { db } from "~/server/db";
import { createVm, execAwait } from "~/server/freestyle-api";
import * as vfs from "~/server/utils/vfs";

export async function deployToVm(
  projectId: string,
  projectVfs: vfs.VFS,
): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
  });
  if (!project) return "Project not found";

  let vmId = project.vmId;

  if (!vmId) {
    const vm = await createVm();
    vmId = vm.id;
    await db.project.update({
      where: { id: projectId },
      data: { vmId },
    });
  }

  if (!vmId) return "Failed to create VM";

  await execAwait(vmId, "pkill -f 'npm run dev' || true");
  await execAwait(vmId, "pkill -f 'socat' || true");
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
  await execAwait(vmId, "cd /app && npm i -g pnpm && pnpm install");
  await execAwait(vmId, "cd /app && CONVEX_AGENT_MODE=anonymous pnpm dev &");
  await execAwait(vmId, "socat TCP-LISTEN:3000,fork TCP:localhost:5173 &");

  return `Deployed to https://${vmId}.vm.freestyle.sh`;
}
