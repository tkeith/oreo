import { db } from "~/server/db";
import { execAwait } from "~/server/freestyle-api";
import * as vfs from "~/server/utils/vfs";

export type DeploymentEventHandler = (message: string) => void | Promise<void>;

export interface DeploymentOptions {
  onEvent?: DeploymentEventHandler;
  isInitialDeployment?: boolean;
}

export async function deployToVm(
  projectId: string,
  projectVfs: vfs.VFS,
  options?: DeploymentOptions | DeploymentEventHandler,
): Promise<string> {
  const opts: DeploymentOptions =
    typeof options === "function" ? { onEvent: options } : options || {};
  const { onEvent, isInitialDeployment = false } = opts;
  const emit = async (msg: string) => onEvent?.(msg);

  let project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return "Project not found";

  // Wait for VM readiness (skip if this IS the warm-up)
  if (!isInitialDeployment) {
    await emit("🔄 Checking VM status...");
    for (
      let i = 0;
      i < 120 && ["creating", "warming_up"].includes(project?.vmStatus || "");
      i++
    ) {
      if (i % 10 === 0) await emit(`⏳ Waiting for VM... (${i}s elapsed)`);
      await new Promise((r) => setTimeout(r, 1000));
      project = await db.project.findUnique({ where: { id: projectId } });
    }
  }

  if (project?.vmStatus === "failed" || !project?.vmId)
    return "VM creation failed";

  const vmId = project.vmId;
  await emit(`✅ VM ready: ${vmId}`);

  // Clean up
  await emit("🔄 Cleaning up...");
  for (const cmd of [
    "screen -S convex-dev -X quit || true",
    "pkill -f 'pnpm dev' || true",
    "pkill -f 'node' || true",
    "pkill -f 'convex' || true",
    "rm -rf /app/* && mkdir -p /app",
  ])
    await execAwait(vmId, cmd);

  // Upload files
  const files = vfs.listFiles(projectVfs).filter((f) => f.startsWith("code/"));
  await emit(`📤 Uploading ${files.length} files...`);

  let script = "#!/bin/bash\nmkdir -p /app\n";
  for (const file of files) {
    let content = vfs.readFile(projectVfs, file);
    const targetPath = file.replace(/^code\//, "");

    console.log(`DEBUG: handling targetPath: ${targetPath}`);

    if (targetPath.includes(".env") && content) {
      console.log(`DEBUG: replacing VITE_CONVEX_URL in ${targetPath}`);
      content = content.replace(
        "VITE_CONVEX_URL=http://127.0.0.1:3210",
        `VITE_CONVEX_URL=https://${vmId}.vm.freestyle.sh`,
      );
      console.log(`DEBUG: new content: ${content}`);
    } else {
      console.log(`DEBUG: not replacing VITE_CONVEX_URL in ${targetPath}`);
    }

    const dir = targetPath.substring(0, targetPath.lastIndexOf("/"));
    if (dir) script += `mkdir -p /app/${dir}\n`;
    script += `cat > /app/${targetPath} << 'EOF'\n${content}\nEOF\n`;
  }
  await execAwait(vmId, script);

  // Configure nginx
  await emit("🔧 Configuring nginx...");
  const proxySettings = `
        absolute_redirect off;
        chunked_transfer_encoding off;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;`;

  const nginxConfig = `server {
    listen 3000;
    server_name _;
    location / {
        proxy_pass http://localhost:5173;${proxySettings}
    }
    location /api/ {
        proxy_pass http://localhost:3210/api/;${proxySettings}
    }
}`;

  await execAwait(
    vmId,
    `cat > /etc/nginx/sites-available/app << 'EOF'\n${nginxConfig}\nEOF`,
  );
  await execAwait(
    vmId,
    "rm -f /etc/nginx/sites-enabled/default && ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app && (nginx -s reload || nginx)",
  );

  // Install and start
  await emit(
    isInitialDeployment
      ? "📦 Installing dependencies (first time, this will speed up future deployments)..."
      : "📦 Installing dependencies...",
  );

  await execAwait(vmId, "cd /app && pnpm install && pnpm convex codegen");
  await execAwait(
    vmId,
    "screen -dmS convex-dev bash -c 'cd /app && CONVEX_AGENT_MODE=anonymous pnpm dev'",
  );

  const url = `https://${vmId}.vm.freestyle.sh`;
  await emit(
    `✨ ${isInitialDeployment ? "VM warmed up" : "Deployment complete"}!`,
  );
  return `${isInitialDeployment ? "VM ready" : "Deployed"} at ${url}`;
}
