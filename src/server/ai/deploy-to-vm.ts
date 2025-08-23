import { db } from "~/server/db";
import { execAwait } from "~/server/freestyle-api";
import * as vfs from "~/server/utils/vfs";

export type DeploymentEventHandler = (message: string) => void | Promise<void>;

export interface DeploymentOptions {
  onEvent?: DeploymentEventHandler;
  isInitialDeployment?: boolean;
}

export interface DeployHelperOptions {
  onEvent?: DeploymentEventHandler;
}

export interface VerifyResult {
  success: boolean;
  stdout: string;
  stderr: string;
  statusCode: number;
}

// Step 1: Stop old app and copy new code
export async function stopAndCopyCode(
  vmId: string,
  projectVfs: vfs.VFS,
  options?: DeployHelperOptions,
): Promise<void> {
  const emit = async (msg: string) => options?.onEvent?.(msg);

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

    if (targetPath.includes(".env") && content) {
      content = content.replace(
        "VITE_REAL_CONVEX_URL=http://127.0.0.1:3210",
        `VITE_REAL_CONVEX_URL=https://${vmId}.vm.freestyle.sh`,
      );
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
}

// Step 2: Run setup (install packages)
export async function runSetup(
  vmId: string,
  options?: DeployHelperOptions & { isInitialDeployment?: boolean },
): Promise<void> {
  const emit = async (msg: string) => options?.onEvent?.(msg);

  await emit(
    options?.isInitialDeployment
      ? "📦 Installing dependencies (first time, this will speed up future deployments)..."
      : "📦 Installing dependencies...",
  );

  await execAwait(vmId, "cd /app && pnpm install && pnpm convex codegen");
}

// Step 3: Verify code (run lint)
export async function verifyCode(
  vmId: string,
  options?: DeployHelperOptions,
): Promise<VerifyResult> {
  const emit = async (msg: string) => options?.onEvent?.(msg);

  await emit("🔍 Verifying code...");
  const result = await execAwait(vmId, "cd /app && pnpm lint");

  const success = result.statusCode === 0;
  if (success) {
    await emit("✅ Code verification passed!");
  } else {
    await emit(
      `⚠️ Code verification failed with exit code ${result.statusCode}`,
    );
  }

  return {
    success,
    stdout: result.stdout,
    stderr: result.stderr,
    statusCode: result.statusCode,
  };
}

// Step 4: Launch the app
export async function launchApp(
  vmId: string,
  options?: DeployHelperOptions & { isInitialDeployment?: boolean },
): Promise<string> {
  const emit = async (msg: string) => options?.onEvent?.(msg);

  await execAwait(
    vmId,
    "screen -dmS convex-dev bash -c 'cd /app && CONVEX_AGENT_MODE=anonymous pnpm dev --typecheck=disable'",
  );

  const url = `https://${vmId}.vm.freestyle.sh`;

  // Wait for app to be ready (up to 1 minute)
  await emit("⏳ Waiting for app to start...");
  const startTime = Date.now();
  const timeout = 60 * 1000; // 1 minute
  let appReady = false;

  while (Date.now() - startTime < timeout) {
    try {
      const apiResponse = await fetch(`${url}/api/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      const appResponse = await fetch(`${url}/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (
        (apiResponse.status >= 200 && apiResponse.status < 300) ||
        (apiResponse.status >= 300 && apiResponse.status < 400) ||
        (apiResponse.status >= 400 &&
          apiResponse.status < 500 &&
          appResponse.status >= 200 &&
          appResponse.status < 300) ||
        (appResponse.status >= 300 && appResponse.status < 400) ||
        (appResponse.status >= 400 && appResponse.status < 500)
      ) {
        appReady = true;
        await emit("✅ App is ready!");
        break;
      }
    } catch (error) {
      // Ignore errors during health check
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!appReady) {
    await emit("⚠️ App startup timed out after 1 minute (continuing anyway)");
  }

  await emit(
    `✨ ${options?.isInitialDeployment ? "VM warmed up" : "Deployment complete"}!`,
  );
  return url;
}

// Simplified deployToVm that uses the helper functions
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

  // Use helper functions
  await stopAndCopyCode(vmId, projectVfs, { onEvent });
  await runSetup(vmId, { onEvent, isInitialDeployment });
  const url = await launchApp(vmId, { onEvent, isInitialDeployment });

  return `${isInitialDeployment ? "VM ready" : "Deployed"} at ${url}`;
}

// Helper to get VM ID for a project
export async function getProjectVmId(
  projectId: string,
): Promise<string | null> {
  const project = await db.project.findUnique({ where: { id: projectId } });
  return project?.vmId || null;
}
