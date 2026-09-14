/**
 * 知乎开放平台凭证（仅服务端）。
 *
 * 三种凭证是独立的三样东西：
 * - `appId`      标识我们的应用，**公开**（可以出现在授权地址里）
 * - `appKey`     后端换 OAuth token 用，**必须保密**
 * - `accessSecret` 鉴权开放平台调用方，**必须保密**
 *
 * 解析顺序（按知乎黑客松 Skill 的安全边界）：
 * 1. 环境变量（部署平台的 Secret）
 * 2. 本地凭据文件 `zhihu.credentials.local.json`（**不进 git**，随离线部署上传；
 *    本项目的部署平台不提供 Secret 注入，只能这样把密钥带到线上）
 * 3. 项目配置 `hackathon.config.json`（只含公开的 appId / redirectUri）
 * 4. macOS 钥匙串（本地开发时 app_key 的存放处，由 Skill 的 set_app_key 写入）
 *
 * 按知乎开放平台的要求，密钥不应写进被跟踪的源码、日志或前端响应；
 * 本模块只在服务端运行，对外只暴露 `configured` 与缺失项名字，绝不回传密钥内容。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ZhihuCredentials {
  appId: string;
  appKey: string;
  accessSecret: string;
  redirectUri: string;
  /** 凭证来源，便于页面如实提示 */
  source: "env" | "file" | "keychain" | "project-config" | "partial" | "none";
  /** 缺失的字段名（不含值） */
  missing: string[];
}

interface CredentialFile {
  appId?: string;
  appKey?: string;
  accessSecret?: string;
  redirectUri?: string;
}

interface HackathonConfig {
  oauth?: {
    enabled?: boolean;
    appId?: string;
    redirectUri?: string | null;
    credentialService?: string;
    credentialAccount?: string;
  };
}

const FILE_NAME = process.env["ZHIHU_CREDENTIALS_FILE"] ?? "zhihu.credentials.local.json";
const CONFIG_NAME = "hackathon.config.json";

function readJson<T>(name: string): T | null {
  try {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function pick(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "";
}

/** 本地开发时 app_key 存在 macOS 钥匙串里；读一次缓存 60 秒，避免每个请求都调 security */
let keychainCache: { value: string; at: number } | null = null;

function readKeychainAppKey(config: HackathonConfig | null): string {
  if (process.platform !== "darwin") return "";
  const service = config?.oauth?.credentialService;
  const account = config?.oauth?.credentialAccount;
  if (!service || !account) return "";
  if (keychainCache && Date.now() - keychainCache.at < 60_000) return keychainCache.value;
  try {
    const value = execFileSync("/usr/bin/security", ["find-generic-password", "-s", service, "-a", account, "-w"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    }).trim();
    keychainCache = { value, at: Date.now() };
    return value;
  } catch {
    keychainCache = { value: "", at: Date.now() };
    return "";
  }
}

export function getZhihuCredentials(): ZhihuCredentials {
  const file = readJson<CredentialFile>(FILE_NAME) ?? {};
  const config = readJson<HackathonConfig>(CONFIG_NAME);
  const fromKeychain = readKeychainAppKey(config);

  const appId = pick(process.env["ZHIHU_OAUTH_APP_ID"], file.appId, config?.oauth?.appId);
  const appKey = pick(process.env["ZHIHU_OAUTH_APP_KEY"], file.appKey, fromKeychain);
  const accessSecret = pick(process.env["ZHIHU_ACCESS_SECRET"], file.accessSecret);
  const redirectUri = pick(
    process.env["ZHIHU_OAUTH_REDIRECT_URI"],
    file.redirectUri,
    config?.oauth?.redirectUri ?? undefined,
  );

  const fromEnv = Boolean(process.env["ZHIHU_OAUTH_APP_KEY"] || process.env["ZHIHU_ACCESS_SECRET"]);
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
      : file.appKey
        ? "file"
        : fromKeychain
          ? "keychain"
          : "project-config";

  return { appId, appKey, accessSecret, redirectUri, source, missing };
}

/**
 * 对外可安全暴露的状态（只有布尔与字段名，没有值）。
 *
 * 注意：`missing` 只包含**影响登录**的字段（appId / appKey / redirectUri），
 * 供前端展示给用户。Access Secret 是**服务端读数据**用的，属于运维配置，
 * 不出现在用户可见的缺失项里（见 `dataReady`）。
 */
export function zhihuCredentialStatus() {
  const c = getZhihuCredentials();
  const loginReady = Boolean(c.appId && c.appKey && c.redirectUri);
  return {
    configured: c.missing.length === 0,
    /** 用户只需授权登录：这三项齐了就行 */
    loginReady,
    /** 服务端是否能读用户数据（需要 Access Secret，属运维配置，不给用户看） */
    dataReady: loginReady && Boolean(c.accessSecret),
    source: c.source,
    /** 只列影响登录的缺失项 */
    missing: c.missing.filter((m) => m !== "accessSecret"),
    /** appId 是公开的，可以给前端拼授权地址；appKey / accessSecret 永不下发 */
    appId: c.appId,
    redirectUri: c.redirectUri,
  };
}

/** 数据接口需要 Access Secret（鉴权调用方）；缺失时抛"服务端未就绪"而不是给用户看技术细节 */
export function requireAccessSecret(): string {
  const c = getZhihuCredentials();
  if (!c.accessSecret) {
    // 服务端配置缺失：抛一个内部错误码，由上层转成对用户友好的降级状态
    throw new Error("ZHIHU_SERVER_NOT_READY");
  }
  return c.accessSecret;
}
