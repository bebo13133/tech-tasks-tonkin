// AI Ментор: гради system prompt-а и вика Claude. Ползва се от app/api/ask-mentor/route.ts.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Конфигуруем през env; default по изискване на заданието.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export type UserContext = {
  name?: string;
  business_type?: string;
  monthly_revenue?: string;
  membership_days?: number;
  last_completed_resource?: string;
};

// Базовият system prompt по заданието.
const BASE_SYSTEM_PROMPT = `Ти си AI Ментор на МАБИ — предприемаческа академия за собственици
на бизнес с 200,000+ лв. годишен оборот.
Стил: директен, конкретен, практичен. Без мотивационен speaker тон.
Казваш "ти". На български.
Не даваш финансов, правен или медицински съвет.
Ако въпросът е извън бизнес темите — отклони учтиво.`;

export const buildSystemPrompt = (ctx?: UserContext): string => {
  if (!ctx) return BASE_SYSTEM_PROMPT;

  const lines: string[] = [];
  if (ctx.name) lines.push(`- Име: ${ctx.name}`);
  if (ctx.business_type) lines.push(`- Тип бизнес: ${ctx.business_type}`);
  if (ctx.monthly_revenue) lines.push(`- Месечен оборот: ${ctx.monthly_revenue}`);
  if (typeof ctx.membership_days === "number")
    lines.push(`- Дни като член: ${ctx.membership_days}`);
  if (ctx.last_completed_resource)
    lines.push(`- Последен завършен ресурс: ${ctx.last_completed_resource}`);

  if (lines.length === 0) return BASE_SYSTEM_PROMPT;

  return `${BASE_SYSTEM_PROMPT}

Контекст за потребителя (съобрази отговора с него):
${lines.join("\n")}`;
};

export const askMentor = async (
  question: string,
  userContext?: UserContext
): Promise<string> => {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(userContext),
    messages: [{ role: "user", content: question }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
};
