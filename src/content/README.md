# 剧情文本（改这里就能改剧情，不用改代码）

## 目录

- `stories/*.json` —— 每个文件就是一条可玩的「穿越世界线」。文件名随意（建议 `序号-名字.json`），新增一个文件，大厅里就自动多一张卡片。
- `upcoming.json` —— 「即将开启」的世界卡片（只有封面和简介，还不能玩）。

## 一条世界线里可以改什么

| 字段 | 意思 |
| --- | --- |
| `id` | 唯一编号，英文小写，别和别的文件重复 |
| `chapterLabel` | 世界线标签，如「世界线 · 03」 |
| `card.question` | 大厅卡片上的「如果」提问 |
| `card.hook` | 卡片上的一句钩子 |
| `card.category` | 分类，用于大厅筛选（可自定义新分类） |
| `card.tags` | 卡片小标签 |
| `card.players` | 「x 万人进入」文案 |
| `card.cover` | 兜底渐变色：`night` / `dusk` / `ember` / `forest` / `violet` |
| `card.coverImage` | 封面图：`corridor` / `dusk` / `mind` / `mosquito` / `money` / `rewind` |
| `card.icon` | 图标：`bike` / `globe` / `brain` / `bug` / `hourglass` / `repeat` |
| `portal.title` `portal.action` | 回答页里穿越入口的文案 |
| `background` | 世界背景图：`corridor` / `dusk` |
| `cast` | 出场角色：`linxia`（林夏）/ `chenmo`（陈默） |
| `introLines` | 穿越开场的两三句话 |
| `nodes` | 正片对白，按顺序播放 |
| `choicePrompt` | 选择前的提示语 |
| `choices` | 两个选项 A / B，`ending` 指向对应结局 |
| `endings.A` / `endings.B` | 结局的标题、总结和结尾对白 |
| `endings.X.next` | 可选。写了就表示这个结局还能继续往下长：`prompt` 是新的提问，`choices` 里每个选项的 `ending` 指向下一层结局（约定用父结局 key 加字母，如 `A` → `AA`/`AB`） |

### 树状结局

结局可以无限往下分叉。没有 `next` 的结局才算「终局」，会计入结局图鉴：

```
A ──┬── AA（终局）
    └── AB ──┬── ABA（终局）
             └── ABB（终局）
```

## 每一句台词怎么写

```json
{ "speaker": "narrator", "text": "旁白就用 narrator" }
{ "speaker": "linxia", "expression": "tense", "text": "角色说话就写角色编号" }
```

`expression` 表情可选：`calm`（平静）、`tense`（紧张）、`relieved`（松一口气），不写默认 `calm`。

## 注意

- 必须是合法 JSON：字符串用英文双引号，条目之间用逗号，最后一条后面不要加逗号。
- 背景、封面、角色只能从上面列出的编号里挑；需要新形象请让我先生成图片再加进资源库。
