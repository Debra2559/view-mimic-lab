# 看山画境（穿越乎）

> 把知乎上的好回答，变成**可以走进去的世界线**、**能玩一次的剧场**、和**值得分享的金句卡**。

一个竖屏优先的「互动回答」产品原型：信息流里是真实内容，点开裂缝就进入一条世界线，
在选择里走完一个结局；不想玩长的，就进「金句剧场」玩一次抉择，
或者把一句话变成一张能带走的金句卡。

---

## 快速开始

```bash
# 需要 Node 20+（开发时使用 22.22.2）
npm install
npm run dev          # → http://localhost:8080
```

> 端口固定 **8080**（`vite.config.ts` 由 `@lovable.dev/vite-tanstack-config` 托管，锁定了端口与 host）。

### 生产构建与部署

```bash
npm run build        # 产物输出到 app-dist/（不是默认的 .output/，原因见下方「部署」）
PORT=8080 node app-dist/server/index.mjs
```

### 环境变量

| 变量 | 作用 | 不配置会怎样 |
|---|---|---|
| `LOVABLE_API_KEY` | 「锻造台」的 AI 生成（生成新世界线 / 检索帖子） | 只有锻造台不可用并提示「缺少 AI 配置」，其余功能正常 |
| `ZHIHU_OAUTH_APP_ID` / `ZHIHU_OAUTH_APP_KEY` / `ZHIHU_ACCESS_SECRET` / `ZHIHU_OAUTH_REDIRECT_URI` | 知乎账号登录与用户数据 | 右下角登录入口仍在，但点开会提示缺少哪几项；**其余功能全部正常** |

也就是说：**别人克隆下来不配任何 Key，也能跑通全部既有内容**（世界线 / 剧场 / 金句卡 / 导入文章）。

> 知乎那四项需要**先在黑客松活动页登记项目**才能拿到，见下方
> [🔴 部署前必须先做这一步](#-部署前必须先做这一步填写黑客松项目的-oauth-凭证)。
> 也可以不设环境变量，改用 `zhihu.credentials.local.json`（推荐，见同一节）。

---

## 产品结构（四层内容模型）

| 层 | 形态 | 入口 | 内容量 |
|---|---|---|---|
| L0 | 原文（知乎回答） | 主页信息流 | 6 篇本地帖 + **10 篇从知乎导入的真文章** |
| L1 | **世界线**：转场 → 入境 → 对白 → 选择 → 树状结局 → 图鉴 | 文章页的「裂缝入口」 | 7 条 |
| L2 | **金句剧场**：单幕 + 一次抉择 + 多结局 | 「看山画境」大厅（互动游戏社区） | 6 个 |
| L3 | **金句闪卡**：一句话变一张可分享的海报卡 | 文章正文对应段落上的「金句卡」标记 | 10 张 |

两个闭环：

- **穿越**：文章 → 裂缝 → 世界线 → 结局 → 观众席（「XX% 的人和你走到同一个结局」）→ 探索另一条。
- **分享**：段落标记 / 划词 → 生成海报卡（canvas 750×1200）→ 二维码指向 `?flash=` / `?hl=` →
  扫码回到原文那一段并高亮，自动把卡片弹出来。

---

## 本次迭代改了什么（2026-09-13 ~ 09-14）

> 给队友和评审看的变更摘要，按模块列，和 commit 一一对应。

### 1. 主页重构：只放文章

- 移除了「金句闪卡」「金句剧场」两个独立模块（以及它们的左右翻页轮播）。
- 主页信息流 = 本地 6 篇 + **10 篇导入的真文章**（每 2 条插 1 篇，余量补末尾），每篇带
  「读全文」「内嵌 1 张金句卡」入口与知乎原文外链。
- 相应删掉了卡片的整卡透明跳转浮层（改为可见链接）与剧场卡的整卡压暗层（改为只在文字区局部压暗）。
- 未再使用的 4 个组件归档到 `.archive-unused-modules/`（留档参考，不参与构建）。

### 2. 金句卡重设计：标题党海报 + 看山大脸

- **焦点**：主标题改为「数字/结论型」标题党，关键数字用**唯一的高饱和强调色**放到最大
  （例：法治卡 = 黑白蓝冷底 + 警示红 `涉案 1.84 亿`）。
- **精简**：去掉背景大字、热度、分类标签等无效信息，只留 标题 → 悬念 → 出口 → 来源。
- **悬念**：原金句改写成「制造好奇、不揭晓答案」的副题（「为什么 46 次伸手，一次都没被发现？」）。
- **画面**：新增看山「大脸贴镜头」素材（`mascot-peek.webp`：狐狸脸占满画面、大眼睛、大鼻子顶到镜头）。
- **出口文案**：二维码配强利益诱导（「扫码查看详细通报」）；结局数从 2 个扩展到**支持 3 个**。
- 出图支持双模式：`headline`（闪卡海报）/ `quote`（划线金句），共用同一套出图管线。

### 3. 新增三个金句剧场

| 编号 | 剧场 | 新分类 | 结构 |
|---|---|---|---|
| 金句剧场 · 04 | 《六人寝》 | 社交处境 | 3 选项 → 3 结局 |
| 金句剧场 · 05 | 《今天这一次》 | 竞技抉择 | 3 选项 → 3 结局 |
| 金句剧场 · 06 | 《人工窗口》 | 科技与人 | 3 选项 → 3 结局 |

- 三个新分类为**新增**（原有：现实向 / 人性实验 / 商业）。
- 《人工窗口》源自一份完整的竖屏影游剧本（5 幕 20 节点 5 结局），这里取其发布会核心抉择压成单幕；
  隐藏结局《四十年后》的立意并入结局文案。
- 涉及真实案件 / 真实战队的两份剧本参考**已做虚构化处理**（角色情节全部虚构、不指向任何真实的人与队伍）。
- 配套：`audience.ts` 补了三结局的观众席基线（否则第三个结局只会显示 1%）。

### 4. 剧场移入「看山画境」大厅（互动游戏社区）

- 大厅顶部新增「金句剧场」区，剧场以**海报卡**呈现（与分享出去的卡片同一套视觉），
  支持搜索过滤，点击直接进入剧场。

### 5. 性能修复：三个真实的卡顿根因

| 现象 | 根因 | 修复 |
|---|---|---|
| 点裂缝入口要等 5-6 秒 | 转场阶段写死了 2600ms（首次）/1600ms（再次）**强制等待且不可跳过** | 改为 900/400ms，**整层可点跳过**，并支持 `prefers-reduced-motion` |
| 对白读得慢 | 打字机 45ms/字 | 改为 18ms/字（点击仍可立即补全整句） |
| **首次访问什么都慢、第二次就快** | 线上曾用 `npm run dev` 部署 = 开发模式**按需编译 SSR**，服务空闲后首个请求要现场编译整张模块图（实测 20–120 秒） | **改用生产构建部署**，冷启动 **442ms** |

### 6. 内容与素材

- **导入真文章**：用知乎官方 CLI 抓取 10 篇真实回答（正文段落 + 作者 + 徽章 + 赞数 + 原文链接），
  存为 `src/lib/articles.ts`；每篇自动定位「金句段」，金句卡就挂在那一段上。
- **事实对齐**：修正了 3 处与原文不符的表述，10 张闪卡的来源标题与原文链接全部对齐真实文章。
- **看山素材**：新增 `mascot-peek.webp`（大脸贴镜头）；裂缝入口角标去掉了白底与边框（直接透出封面）。

---

## 目录结构

```
src/
├─ routes/
│  ├─ index.tsx            主页信息流（本地帖 + 导入文章）
│  ├─ answer.$id.tsx       回答/文章页：裂缝入口、划线金句、金句卡标记
│  ├─ me.tsx               个人页：用户信息 + 创作 / 关注（加载更多）
│  ├─ api.zhihu.callback.tsx  知乎 OAuth 回调（换 token → 写会话 → 跳 /me）
│  └─ world.$storyId.tsx   世界线/剧场（转场 → 入境 → 对白 → 选择 → 结局 → 图鉴）
├─ components/story/
│  ├─ StoryWorld.tsx       世界线引擎（阶段机 + 打字机 + 立绘 + 观众席）
│  ├─ WorldHub.tsx         「看山画境」大厅：金句剧场区 + 世界线网格 + 锻造台
│  ├─ TheaterEntry.tsx     剧场海报卡          ├─ ArticleCard.tsx          主页文章卡
│  ├─ ImportedArticleView.tsx 导入文章阅读页   ├─ QuoteCardSheet.tsx       出图分享面板
│  └─ PortalEntry.tsx      裂缝入口（首页形态）
├─ content/stories/*.json  13 个故事：01-07 世界线 / 08-13 金句剧场
├─ lib/
│  ├─ articles.ts          10 篇导入文章（段落 + 金句段位置）
│  ├─ flash-card.ts        出图管线（headline / quote 双模式，750×1200 canvas）
│  ├─ feed.ts              本地信息流帖子
│  ├─ zhihu/               知乎登录与用户数据（全部仅服务端）
│  │  ├─ credentials.server.ts  凭证解析（环境变量 → 本地凭据文件）
│  │  ├─ oauth.server.ts        授权地址、换 token、会话 cookie
│  │  ├─ api.server.ts          用户数据接口（contents / followees）
│  │  └─ zhihu.functions.ts     前端可调用的服务端函数（handler 内动态导入服务端模块）
│  └─ story/               story 引擎与数据
│     ├─ flash.ts          10 张金句闪卡（标题党主标题 + 悬念 + 强调色 + 诱导文案）
│     ├─ loader.ts         故事加载与归一化（import.meta.glob，eager）
│     ├─ cast.ts           统一立绘库          ├─ assets.ts   统一场景/封面库
│     ├─ audience.ts       观众席（本机计数 + 演示基线）
│     └─ generate.functions.ts  锻造台（需要 LOVABLE_API_KEY）
└─ assets/
   ├─ mascot/              看山素材（动图 webp + 静态 png + 大脸 mascot-peek.webp）
   └─ story/               立绘 / 场景图 / 封面图

scripts/
└─ fix-css-hashes.mjs      构建后修补 CSS 哈希不一致（见「部署」小节）
```

---

## 怎么加内容

### 加一条世界线或剧场

在 `src/content/stories/` 新增 JSON（编号接续），字段定义见 `src/lib/story/types.ts`。最小骨架：

```json
{
  "id": "my-story",
  "chapterLabel": "金句剧场 · 07",
  "card": { "question": "…", "hook": "…", "category": "现实向", "tags": ["单幕"], "players": "金句剧场", "cover": "night", "coverImage": "rewind", "icon": "repeat" },
  "portal": { "title": "检测到可进入的金句剧场", "action": "一次抉择：…" },
  "background": "rewind",
  "cast": ["sunian"],
  "introLines": ["情境一", "情境二"],
  "nodes": [{ "speaker": "narrator", "text": "…" }],
  "interactions": [],
  "choicePrompt": "…",
  "choices": [{ "key": "A", "label": "…", "innerVoice": "…", "ending": "A" }],
  "endings": { "A": { "title": "…", "summary": "…", "nodes": [] } }
}
```

要点：

- `chapterLabel` 以「**金句剧场**」开头 → 自动进入大厅的剧场区；「世界线 · NN」→ 进世界线网格。
- `endings` 是 Record，**支持 2 个以上结局**；`choices` 同理支持 3+ 选项。
- `background` / `coverImage` 只能取 `src/lib/story/assets.ts` 里的 key；`cast` 取 `cast.ts` 的角色 id。
- 改完**必须清 Vite 缓存**（`rm -rf node_modules/.vite`）——`import.meta.glob` 是 eager 的，不清会读不到新 JSON。
- 新增剧场若结局多于 2 个，记得在 `audience.ts` 的 `BASELINE` 里补该 id 的各结局人数（否则新结局只显示 1%）。

### 加一张金句闪卡

1. 在 `src/lib/story/flash.ts` 增加一项：`headlineLead` + `headlineNumber`（会被强调色放大）+
   `headlineTail?` + `teaser`（悬念，不揭晓答案）+ `category` + `colors`（冷色底）+ `accent`（唯一亮色）+
   `qrHint`（强利益诱导）。
2. 若要挂在文章里，在 `src/lib/articles.ts` 增加/关联一篇导入文章，并设 `flashParaIndex`（挂第几段）。

### 导入一篇真文章

数据来源是知乎官方 CLI（`search` 返回项里的 `ContentText` 即回答正文）。
把正文按段落存进 `ImportedArticle.paragraphs`，并把 `flashParaIndex` 指向最相关的那一段即可——
主页卡片、文章页、金句卡标记都会自动接上。

---

## 内容来源与 AI 透明度

- **导入文章**：来自知乎开放平台抓取，保留作者、徽章、赞数与原文链接，**不改动原文表述**；
  页面上明确标注「知乎 · 导入的真文章」。
- **AI 参与范围**：只有「锻造台」用 AI 生成新世界线（需要 `LOVABLE_API_KEY`）。
  其余全部内容（13 个故事、10 张闪卡、导入文章）都是**人工整理 / 真实数据**，不是运行时 AI 生成。
- **合规处理**：涉及真实案件当事人、真实战队与选手的剧本参考，已全部虚构化；
  不出现真实姓名、不指向任何真实的人与组织；结尾不给「攻略」，只给自省。

---

## 知乎账号登录（OAuth）

右下角常驻一个知乎账号入口：未登录显示「用知乎登录」，登录后显示头像与昵称，
点击进入 **`/me` 个人页**——上面是用户信息，下面按「创作 / 关注的人」两个页签列数据，
都走接口的 `Paging.IsEnd` + `Paging.NextOffset` 翻页，可**点击加载更多**。

---

### 🔴 部署前必须先做这一步：填写黑客松项目的 OAuth 凭证

**不填这一步，登录按钮点下去会提示缺少 appId，`/me` 也只能显示配置清单 —— 这是有意设计的（不静默失败）。**

按顺序做四件事：

| 步骤 | 做什么 | 拿到什么 |
|---|---|---|
| 1️⃣ | 打开**黑客松活动页**，找到我们报名的项目 | — |
| 2️⃣ | 在项目的「知乎登录回调地址」里填：`https://<你的域名>/api/zhihu/callback`<br>（本地调试可填 `http://localhost:8080/api/zhihu/callback`） | 登记好回调地址 |
| 3️⃣ | 保存项目后，活动页会分配 OAuth 凭证 | **`appId`** 与 **`appKey`** |
| 4️⃣ | 到开放平台个人中心 <https://developer.zhihu.com/profile> 取 | **`accessSecret`** |

然后把四项填进凭据文件（**本地与线上用的是同一个文件**）：

```bash
cp zhihu.credentials.example.json zhihu.credentials.local.json
# 编辑 zhihu.credentials.local.json，填入：
#   appId         ← 活动页分配（公开信息）
#   appKey        ← 活动页分配（保密）
#   accessSecret  ← developer.zhihu.com/profile（保密）
#   redirectUri   ← 必须与第 2 步登记的回调地址【完全一致】
```

或者改用环境变量（部署平台注入 Secret 时更方便，会覆盖上面的文件）：

```bash
ZHIHU_OAUTH_APP_ID / ZHIHU_OAUTH_APP_KEY / ZHIHU_ACCESS_SECRET / ZHIHU_OAUTH_REDIRECT_URI
```

填完重启服务即可：右下角出现「用知乎登录」，点进去完成授权，个人页就有数据了。

> **⚠️ 两条硬约束，别踩**
> 1. **`zhihu.credentials.local.json` 不要提交进 git**（已在 `.gitignore` 里）。这是公开仓库，
>    密钥一旦提交就会永久留在 git 历史里。知乎官方规定：App Key 与 Access Secret
>    "禁止写入源码、`.env`、URL、日志、截图、视频、前端响应或 Agent 输出"。
> 2. **`redirectUri` 必须与活动页登记值逐字符一致**（包括 `https` 与结尾有没有斜杠），
>    否则知乎会拒绝授权回调。

---

### 需要四个配置项

| 字段 | 从哪里来 | 是否公开 |
|---|---|---|
| `appId` | **黑客松活动页**登记项目后分配 | 公开（会出现在授权地址里） |
| `appKey` | 同上 | **保密**（后端换 token 用） |
| `accessSecret` | 开放平台个人中心 <https://developer.zhihu.com/profile> | **保密**（鉴权调用方） |
| `redirectUri` | 你自己定，但**必须与活动页登记的回调地址完全一致** | 公开 |

配置方式（二选一，环境变量优先）：

```bash
# 方式一：环境变量（部署平台的 Secret）
export ZHIHU_OAUTH_APP_ID=...
export ZHIHU_OAUTH_APP_KEY=...
export ZHIHU_ACCESS_SECRET=...
export ZHIHU_OAUTH_REDIRECT_URI=https://你的域名/api/zhihu/callback

# 方式二：本地凭据文件（复制示例后填写）
cp zhihu.credentials.example.json zhihu.credentials.local.json
# 然后编辑 zhihu.credentials.local.json
```

> ⚠️ **`zhihu.credentials.local.json` 不进 git**（已在 `.gitignore` 里），但**要随离线部署一起上传**——
> 本项目的独立部署就是这样拿到密钥的。
>
> **绝对不要把 appKey / accessSecret 写进被跟踪的源码或前端代码。** 知乎开放平台的规则明确写着
> "禁止写入源码、`.env`、URL、日志、截图、视频、前端响应或 Agent 输出"；而本仓库是公开仓库，
> 一旦提交就会永久留在 git 历史里。密钥只在本项目的服务端使用，前端只拿得到公开的 `appId`。

### 回调地址

在活动页登记的回调地址，需要和实际路由一致：

```
https://<你的域名>/api/zhihu/callback
```

路由实现见 `src/routes/api.zhihu.callback.tsx`：它读取回调里的 `authorization_code`
（同时兼容 `code`），在服务端换取用户 token，写入 **httpOnly 会话 cookie**，然后跳到 `/me`。
回调失败时（缺授权码、换 token 报错）会渲染一个明确的错误页，而不是白屏。

### 用到的接口

```text
GET  https://openapi.zhihu.com/authorize?redirect_uri=&app_id=&response_type=code   # 授权
POST https://openapi.zhihu.com/access_token                                        # 换 token
GET  https://developer.zhihu.com/api/v1/user/contents?ContentType=all&Offset=&Limit=  # 创作
GET  https://developer.zhihu.com/api/v1/user/followees?Offset=&Limit=                  # 关注
```

请求头：`Authorization: Bearer <accessSecret>`、`X-Request-Timestamp: <秒级时间戳>`、
代表用户时再加 `X-OAuth-Token: <用户 token>`、以及 `Content-Type: application/json`。
分页参数最大 `Limit=50`；**响应里的 `NextOffset` 是 String，要原样回传**。

### 已知边界（不假装有）

- **知乎没有公开「用户资料」接口**：官方 OAuth 文档自己写着"文档提到获取用户信息，但没有提供对应
  endpoint 和响应 schema"。所以登录后若拿不到昵称/头像，个人页会**如实显示"已授权"状态**，
  而不是编一个名字出来；如果 token 交换响应里带了用户字段，会自动显示。
- **未登录时**：配置好 `accessSecret` 后会以「演示模式」展示**凭据所属账号**的公开数据，
  页面顶部有明确的橙色标注。什么都没配时，页面列出缺哪几项、去哪里拿。
- 凭证没配好时不会发起任何请求，也不会弹无意义的报错。

---

## 部署

### 为什么产物目录叫 `app-dist`

`vite.config.ts` 里配了：

```ts
nitro: { preset: "node-server", output: { dir: "app-dist" } }
```

- 默认目标（cloudflare）产出的是 Worker + `wrangler.json`，**不能用 `node` 直接起**，所以要 `node-server`。
- 产物目录特意用中性名 `app-dist`：某些托管平台会把 `.output` / `dist` / `build` 当作「构建产物」**排除在上传之外**，
  而这类平台往往命令窗口很短（探活 60 秒、构建阶段 30 秒），**来不及现场构建**。
  因此采用**本地预构建、产物随源码上传**，线上只负责 `node app-dist/server/index.mjs`（毫秒级启动）。

### 部署步骤

```bash
npm install
npm run build                       # 产出 app-dist/（构建后会跑 scripts/fix-css-hashes.mjs 修补，见下）
PORT=8080 node app-dist/server/index.mjs
```

> ⚠️ **改完代码必须先 `npm run build` 再部署**，否则线上跑的是旧产物。
> `app-dist/` 是构建产物：**不要提交进 git**（但部署平台的「上传目录」里需要它存在）。
> 服务必须监听 `PORT` 并绑定 `0.0.0.0`（反代场景需要）。

### 构建后修补：CSS 哈希不一致（`scripts/fix-css-hashes.mjs`）

生产构建有个坑，已在构建流程里自动修补：

- **现象**：SSR 注入的 `<link rel="stylesheet" href="/assets/styles-XXXX.css">` 指向一个**不存在的文件名**（404），
  而真实产出的是 `styles-YYYY.css`。
- **原因**：SSR 与客户端是两次独立的构建 pass，各自对同一份 `styles.css` 算了一次内容哈希，结果不一致
  （SSR 产物里同时残留两个名字）。
- **后果**：样式只能等客户端 JS 注水后才注入 → 首屏 **FOUC**（先看到无样式页面）+ 控制台一个 404。
- **修法**：构建后扫描服务端产物，把指向不存在文件的引用改写成真实产出的那个名字。
  （不能只把 CSS 复制一份过去——服务端用的是构建期资产清单，事后新增的文件不会被服务。）

所以要改构建产物目录名字时，记得同步改 `scripts/fix-css-hashes.mjs` 里的 `DIST_DIR`（默认 `app-dist`）。

---

## 已知限制

- **开发模式冷启动慢**：`npm run dev` 是按需编译，服务空闲后首个请求可能 20–120 秒（刷新一次即可）。
  演示 / 部署请务必用**生产构建**，冷启动约 0.4 秒。
- **生产构建下没有 `data-tsd-source` 调试标注**（那是 dev 插件注入的）。需要按 DOM 定位排查时，
  用 `npm run dev` 起本地环境。
- **观众席是演示数据**：`audience.ts` 里是演示基线 + 本机 `localStorage` 计数，没有服务端统计。
- **锻造台的 AI 生成需要 Key**；不配 Key 时该入口会明确提示，不会静默失败。
- 单端口 HTTP 服务，无数据库；所有状态在浏览器本地（localStorage）。

---

## 分支与协作

- 本次开发分支：**`feat/kanshan-huajing`**（我们这一版完整改动都在这条分支上）。
- `main` 与 Lovable 编辑器相连：**不要重写已推送的历史**（不要 force push / rebase / amend 已推送的提交），
  否则会破坏 Lovable 侧的项目历史。详见 `AGENTS.md`。
- 我们的提交历史与上游 `main` 无共同祖先（本项目从线上部署无损重建），因此这条分支在 GitHub 上表现为**独立分支**。
