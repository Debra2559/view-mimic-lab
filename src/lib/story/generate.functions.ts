/** 输入一条真实的知乎「如果」回答，自动生成一条可玩的穿越世界线。 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  question: z.string().min(2).max(120),
  answer: z.string().min(30).max(8000),
});

const Expression = z.enum(["calm", "tense", "relieved"]);

const NodeSchema = z.object({
  speaker: z.enum(["narrator", "character"]),
  expression: Expression,
  text: z.string(),
});

const EndingSchema = z.object({
  title: z.string(),
  summary: z.string(),
  nodes: z.array(NodeSchema),
});

export const GeneratedSchema = z.object({
  question: z.string(),
  hook: z.string(),
  category: z.enum(["现实向", "硬核脑洞", "人性实验", "生态自然", "时间循环"]),
  tags: z.array(z.string()),
  icon: z.enum(["bike", "globe", "brain", "bug", "hourglass", "repeat"]),
  coverKey: z.enum(["night", "dusk", "ember", "forest", "violet"]),
  backgroundKey: z.enum(["corridor", "dusk", "mind", "mosquito", "money", "rewind"]),
  characterId: z.enum(["linxia", "chenmo", "sunian", "heyu", "zhouyan", "luzhao"]),
  portalTitle: z.string(),
  portalAction: z.string(),
  introLines: z.array(z.string()),
  nodes: z.array(NodeSchema),
  choicePrompt: z.string(),
  choices: z.array(z.object({ key: z.enum(["A", "B"]), label: z.string(), innerVoice: z.string() })),
  endingA: EndingSchema,
  endingB: EndingSchema,
});

export type GeneratedStoryData = z.infer<typeof GeneratedSchema>;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "question",
    "hook",
    "category",
    "tags",
    "icon",
    "coverKey",
    "backgroundKey",
    "characterId",
    "portalTitle",
    "portalAction",
    "introLines",
    "nodes",
    "choicePrompt",
    "choices",
    "endingA",
    "endingB",
  ],
  properties: {
    question: { type: "string" },
    hook: { type: "string" },
    category: { type: "string", enum: ["现实向", "硬核脑洞", "人性实验", "生态自然", "时间循环"] },
    tags: { type: "array", items: { type: "string" } },
    icon: { type: "string", enum: ["bike", "globe", "brain", "bug", "hourglass", "repeat"] },
    coverKey: { type: "string", enum: ["night", "dusk", "ember", "forest", "violet"] },
    backgroundKey: {
      type: "string",
      enum: ["corridor", "dusk", "mind", "mosquito", "money", "rewind"],
    },
    characterId: {
      type: "string",
      enum: ["linxia", "chenmo", "sunian", "heyu", "zhouyan", "luzhao"],
    },
    portalTitle: { type: "string" },
    portalAction: { type: "string" },
    introLines: { type: "array", items: { type: "string" } },
    nodes: nodesSchema(),
    choicePrompt: { type: "string" },
    choices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "innerVoice"],
        properties: {
          key: { type: "string", enum: ["A", "B"] },
          label: { type: "string" },
          innerVoice: { type: "string" },
        },
      },
    },
    endingA: endingSchema(),
    endingB: endingSchema(),
  },
} as const;

function nodesSchema() {
  return {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["speaker", "expression", "text"],
      properties: {
        speaker: { type: "string", enum: ["narrator", "character"] },
        expression: { type: "string", enum: ["calm", "tense", "relieved"] },
        text: { type: "string" },
      },
    },
  };
}

function endingSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "summary", "nodes"],
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      nodes: nodesSchema(),
    },
  };
}

const SYSTEM = `你是一个「知乎回答 → 互动乙游世界线」的改编者。
把用户给的真实知乎「如果」提问与回答，改写成一段第二人称、沉浸式的视觉小说剧情。
硬性要求：
- 全部中文，语气克制、有画面感，不要说教，不要出现「知乎」「AI」字样。
- 忠于原回答里的关键设定、细节和结论，把它变成「你」亲身经历的场景。
- nodes 为主线 5~7 条，每条 30~60 字；旁白用 speaker="narrator"，角色台词用 speaker="character"。
- 角色只能从立绘库里选：linxia（林夏，都市里遇到的同龄人）、chenmo（陈默，冷静的观测者）、sunian（苏念，你最亲近的人）、heyu（何予，野外研究员）、zhouyan（周砚，制度里的办事员）、luzhao（陆昭，和你一起被困住的同伴）。
- backgroundKey 按场景挑：corridor 夜晚楼道、dusk 黄昏城市、mind 深夜街边店、mosquito 夏夜湿地、money 明亮大厅、rewind 清晨房间。
- 两个选择必须是真正的价值取舍，没有明显对错；A/B 各自 3~4 条结局 nodes。
- 结局标题 4~8 字，summary 60~110 字，写清这个选择带来的后果与「如果」的答案。
- hook 一句话 15~28 字，tags 恰好 3 个 2~4 字词，introLines 恰好 2 句。
- portalTitle 形如「检测到可进入的世界线」，portalAction 是行动召唤，如「触碰裂缝，成为那个……」。`;

export const generateStory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("缺少 AI 配置，无法生成世界线");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning: { effort: "low" },
        instructions: SYSTEM,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `提问：${data.question}\n\n回答原文：\n${data.answer}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "portal_story",
            strict: true,
            schema: jsonSchema,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("生成太频繁了，稍等一下再试。");
      if (res.status === 402) throw new Error("AI 额度已用完，请在工作区补充额度后再生成。");
      throw new Error(`生成失败（${res.status}）${detail.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            text += event.delta;
          } else if (event.type === "response.completed" && event.response?.output_text) {
            if (!text) text = event.response.output_text;
          }
        } catch {
          /* 忽略非 JSON 的心跳行 */
        }
      }
    }

    if (!text.trim()) throw new Error("这次没有生成出剧情，请再试一次。");

    return GeneratedSchema.parse(JSON.parse(text)) as GeneratedStoryData;
  });
