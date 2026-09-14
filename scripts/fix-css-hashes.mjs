/**
 * 构建后修补：CSS 文件名哈希不一致的问题。
 *
 * 现象：生产构建后，SSR 注入的 <link rel="stylesheet" href="/assets/styles-XXXX.css">
 * 指向一个并不存在的文件名（404），而真实产出的是 styles-YYYY.css。
 * 原因是 SSR 与客户端是两次独立的构建 pass，各自对同一份 styles.css 算了一次内容哈希，
 * 结果不一致（SSR 产物里同时残留两个名字）。
 *
 * 后果：样式只能等客户端 JS 注水后再注入 → 首屏 FOUC（先看到无样式页面）+ 控制台一个 404。
 *
 * 修法：构建后扫描服务端产物，把**指向不存在文件**的 CSS 引用改写成真实产出的那个名字。
 * 注意不能只把文件复制过去——服务端用的是构建期资产清单，事后新增的文件不会被服务。
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIST = process.env["DIST_DIR"] ?? "app-dist";
const PUBLIC_ASSETS = join(DIST, "public", "assets");
const SERVER_DIR = join(DIST, "server");

if (!existsSync(PUBLIC_ASSETS) || !existsSync(SERVER_DIR)) {
  console.log(`[fix-css] 未找到 ${DIST} 的产物目录，跳过`);
  process.exit(0);
}

/** 真实产出的 CSS：同名系列里取最大的那份（完整 Tailwind 产物） */
const produced = readdirSync(PUBLIC_ASSETS)
  .filter((f) => /^styles-.*\.css$/.test(f))
  .sort((a, b) => statSync(join(PUBLIC_ASSETS, b)).size - statSync(join(PUBLIC_ASSETS, a)).size);

if (produced.length === 0) {
  console.log("[fix-css] 产物里没有 styles-*.css，跳过");
  process.exit(0);
}

const canonical = produced[0];
const canonicalSize = Math.round(statSync(join(PUBLIC_ASSETS, canonical)).size / 1024);
const existing = new Set(readdirSync(PUBLIC_ASSETS));

let patchedFiles = 0;
let patchedRefs = 0;

/** 递归改写服务端产物里的孤儿 CSS 引用 */
function patch(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      patch(full);
      continue;
    }
    if (!/\.(mjs|js)$/.test(entry.name)) continue;

    const original = readFileSync(full, "utf8");
    let next = original;
    for (const match of original.matchAll(/\/assets\/(styles-[A-Za-z0-9_-]+\.css)/g)) {
      const name = match[1];
      if (name === canonical || existing.has(name)) continue; // 真实存在的不动
      next = next.split(`/assets/${name}`).join(`/assets/${canonical}`);
      patchedRefs += 1;
    }
    if (next !== original) {
      writeFileSync(full, next, "utf8");
      patchedFiles += 1;
      console.log(`[fix-css] 改写 ${full.replace(`${DIST}/`, "")} 中的孤儿引用`);
    }
  }
}

patch(SERVER_DIR);

console.log(
  patchedRefs > 0
    ? `[fix-css] ✓ 已把 ${patchedRefs} 处引用改写为 ${canonical}（${canonicalSize}KB）`
    : `[fix-css] ✓ CSS 引用一致，无需修补（${canonical}，${canonicalSize}KB）`,
);
