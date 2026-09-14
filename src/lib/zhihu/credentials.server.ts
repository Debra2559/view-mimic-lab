/**
 * 知乎开放平台凭证（仅服务端）。
 *
 * 三种凭证是独立的三样东西：
 * - `appId`      标识我们的应用，**公开**（可以出现在授权地址里）
 * - `appKey`     后端换 OAuth token 用，**必须保密**
 * - `accessSecret` 鉴权开放平台调用方，**必须保密**
 *
 * 解析顺序：
 * 1. 环境变量（部署平台的 Secret / 本地 `.env`）
 * 2. 本地凭据文件 `zhihu.credentials.local.json`（**不进 git**，但会随离线部署一起上传）
 *
 * 按知乎开放平台的要求，密钥不应写进被跟踪的源码、日志或前端响应；
 * 本模块只在服务端运行，对外只暴露 `configured` 与缺失项名字，绝不回传密钥内容。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ZhihuCredentials {
  appId: string;
  appKey: string;
  accessSecret: string;
  redirectUri: string;
  /** 凭证来源，便于页面如实提示 */
  source: "env" | "file" | "partial" | "none";
  /** 缺失的字段名（不含值） */
  missing: string[];
}

interface CredentialFile {
  appId?: string;
  appKey?: string;
  accessSecret?: string;
  redirectUri?: string;
}

const FILE_NAME = process.env["ZHIHU_CREDENTIALS_FILE"] ?? "zhihu.credentials.local.json";

function readCredentialFile(): CredentialFile {
  try {
    const path = join(process.cwd(), FILE_NAME);
    if (!existsSync(path)) return {};
    return JSON.parse(readFileSync(path, "utf8")) as CredentialFile;
  } catch {
    return {};
  }
}

function pick(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "";
}

export function getZhihuCredentials(): ZhihuCredentials {
  const file = readCredentialFile();
  const appId = pick(process.env["ZHIHU_OAUTH_APP_ID"], file.appId);
  const appKey = pick(process.env["ZHIHU_OAUTH_APP_KEY"], file.appKey);
  const accessSecret = pick(process.env["ZHIHU_ACCESS_SECRET"], file.accessSecret);
  const redirectUri = pick(process.env["ZHIHU_OAUTH_REDIRECT_URI"], file.redirectUri);

  const fromEnv = Boolean(process.env["ZHIHU_OAUTH_APP_KEY"] || process.env["ZHIHU_ACCESS_SECRET"]);
  const fromFile = Boolean(file.appKey || file.accessSecret);
  const missing: string[] = [];
  if (!appId) missing.push("appId");
  if (!appKey) missing.push("appKey");
  if (!accessSecret) missing.push("accessSecret");
  if (!redirectUri) missing.push("redirectUri");

  const source: ZhihuCredentials["source"] = missing.length
    ? missing.length === 4
      ? "none"
      : "partial"
    : fromEnv
      ? "env"
      : fromFile
        ? "file"
        : "none";

  return { appId, appKey, accessSecret, redirectUri, source, missing };
}

/** 对外可安全暴露的状态（只有布尔与字段名，没有值） */
export function zhihuCredentialStatus() {
  const c = getZhihuCredentials();
  return {
    configured: c.missing.length === 0,
    source: c.source,
    missing: c.missing,
    /** appId 是公开的，可以给前端拼授权地址；appKey / accessSecret 永不下发 */
    appId: c.appId,
    redirectUri: c.redirectUri,
  };
}

/** 数据接口只需要 Access Secret（读本人数据时不需要 OAuth token） */
export function requireAccessSecret(): string {
  const c = getZhihuCredentials();
  if (!c.accessSecret) {
    throw new Error(
      "缺少知乎 Access Secret：请在 zhihu.credentials.local.json 或环境变量 ZHIHU_ACCESS_SECRET 中配置",
    );
  }
  return c.accessSecret;
}
