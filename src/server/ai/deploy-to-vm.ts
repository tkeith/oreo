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
  await execAwait(vmId, "rm -rf /app/*");

  const files = vfs.listFiles(projectVfs).filter((f) => f.startsWith("code/"));
  let script = "#!/bin/bash\nmkdir -p /app\n";
  for (const file of files) {
    let content = vfs.readFile(projectVfs, file);
    const targetPath = file.replace(/^code\//, "");

    // Update VITE_CONVEX_URL in .env.local
    if (targetPath === ".env.local" && content) {
      content = content.replace(
        "VITE_CONVEX_URL=http://127.0.0.1:3210",
        `VITE_CONVEX_URL=https://${vmId}.vm.freestyle.sh/convex`,
      );
    }

    const dir = targetPath.substring(0, targetPath.lastIndexOf("/"));
    if (dir) script += `mkdir -p /app/${dir}\n`;
    script += `cat > /app/${targetPath} << 'EOF'\n${content}\nEOF\n`;
  }

  await execAwait(vmId, script);

  // Create nginx configuration
  const nginxConfig = `server {
    listen 3000;
    server_name _;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:5173;

        absolute_redirect off;
        chunked_transfer_encoding off;

        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;

        # Set timeouts to 5 minutes (300 seconds) for long operations
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Convex backend proxy (trailing slash auto-strips /convex/)
    location /convex/ {
        proxy_pass http://localhost:3210/;

        absolute_redirect off;
        chunked_transfer_encoding off;

        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;

        # Set timeouts to 5 minutes (300 seconds) for long operations
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

  // Write nginx config and enable it
  await execAwait(
    vmId,
    `cat > /etc/nginx/sites-available/app << 'EOF'\n${nginxConfig}\nEOF`,
  );
  await execAwait(vmId, "rm -f /etc/nginx/sites-enabled/default");
  await execAwait(
    vmId,
    "ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app",
  );
  await execAwait(vmId, "nginx -s reload || nginx");

  await execAwait(vmId, "cd /app && pnpm install");
  // Run pnpm dev inside a detached screen session to provide TTY
  await execAwait(
    vmId,
    "screen -dmS convex-dev bash -c 'cd /app && CONVEX_AGENT_MODE=anonymous pnpm dev'",
  );

  return `Deployed to https://${vmId}.vm.freestyle.sh`;
}
