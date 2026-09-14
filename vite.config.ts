// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // 独立部署用 Node 服务（默认 cloudflare 目标产出的是 Worker，无法用 node 直接起）
  // 产物目录用中性名字：平台的"构建产物目录"（.output/dist/build）会被排除在上传之外，
  // 而这个部署环境的命令窗口很短，来不及现场构建，所以改为本地预构建、随源码上传。
  nitro: { preset: "node-server", output: { dir: "app-dist" } },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      // 独立部署（WorkBuddy 等反代）时必须显式放行，否则 Vite 会以
      // "Blocked request. This host is not allowed" 拒绝反代域名。
      host: "0.0.0.0",
      allowedHosts: true,
    },
  },
});
