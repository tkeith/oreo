import { createTRPCRouter } from "~/server/trpc/main";
import { createProject } from "~/server/trpc/procedures/create-project";
import { listProjects } from "~/server/trpc/procedures/list-projects";
import { getProject } from "~/server/trpc/procedures/get-project";
import { getVfsFiles } from "~/server/trpc/procedures/get-vfs-files";
import { getVfsFileContent } from "~/server/trpc/procedures/get-vfs-file-content";
import { createVfsFile } from "~/server/trpc/procedures/create-vfs-file";
import { updateVfsFile } from "~/server/trpc/procedures/update-vfs-file";
import { sendChatMessage } from "~/server/trpc/procedures/send-chat-message";
import { clearChatHistory } from "~/server/trpc/procedures/clear-chat-history";
import { getChatHistory } from "~/server/trpc/procedures/get-chat-history";
import { getVmUrl } from "~/server/trpc/procedures/get-vm-url";
import { downloadVfsZip } from "~/server/trpc/procedures/download-vfs-zip";

export const projectsRouter = createTRPCRouter({
  create: createProject,
  list: listProjects,
  get: getProject,
  getVfsFiles: getVfsFiles,
  getVfsFileContent: getVfsFileContent,
  createVfsFile: createVfsFile,
  updateVfsFile: updateVfsFile,
  sendChatMessage: sendChatMessage,
  clearChatHistory: clearChatHistory,
  getChatHistory: getChatHistory,
  getVmUrl: getVmUrl,
  downloadVfsZip: downloadVfsZip,
});
