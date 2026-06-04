// ai-mentor.js — ПОПРАВЕНА ВЕРСИЯ
// AI Ментор на МАБИ, мигриран от OpenAI към Anthropic Claude.

// Оригиналната (счупена) версия е запазена в ai-mentor-original.js.
// Всяка поправка по-долу е маркирана с „ГРЕШКА #N" и съответства на
// обясненията в README.md на тази папка.

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Моделът е изведен в константа (от env с fallback), за да не е „заровен"
// в логиката и да се сменя на едно място. По подразбиране ползваме
// claude-sonnet-4-6 — същият модел, който заданието иска в Задача B.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

async function askMentor(userQuestion, userContext) {
  const systemPrompt = buildSystemPrompt(userContext);

  // ГРЕШКА #4 (поправена): липсваше try/catch — всяка мрежова или API
  // грешка хвърляше необработена и сриваше извикващия код.
  try {
    const response = await client.messages.create({
      // ГРЕШКА #1 (поправена): "claude-opus-4-5" е НЕВАЛИДЕН Claude модел.
      // Валидни: claude-sonnet-4-6, claude-opus-4-7, claude-haiku-4-5-20251001.
      model: MODEL,
      max_tokens: 1024,

      // ГРЕШКА #2 (поправена) — ГЛАВНАТА причина „Claude не зачита промптовете":
      // Anthropic API НЕ приема съобщение с role: "system" вътре в messages[].
      // System prompt-ът се подава като ОТДЕЛЕН top-level параметър `system`.
      // В оригинала system съобщението се игнорираше като невалидна role →
      // моделът никога не виждаше инструкциите.
      system: systemPrompt,

      messages: [
        // messages[] съдържа само реалния диалог (user/assistant).
        { role: "user", content: userQuestion },
      ],
    });

    // ГРЕШКА #3 (поправеноо): response.choices[0].message.content е OpenAI формат.
    // Anthropic връща масив `content` от блокове; текстът е в content[i].text.
    // Извличаме всички текстови блокове и ги съединяваме — по-устойчиво от
    // твърдо content[0].text (Claude може да върне повече от един блок).
    return response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  } catch (err) {
    // Логваме без чувствителни данни и пре-хвърляме, за да може
    // API слоят над нас да върне коректен HTTP статус (напр. 502).
    console.error("[askMentor] Claude API error:", err?.message || err);
    throw err;
  }
}

function buildSystemPrompt(ctx) {
  // ГРЕШКА #5 (поправена): липсваше guard за липсващ/непълен контекст —
  // ако ctx е undefined, ctx.name хвърляше TypeError още преди API извикването.
  const safeCtx = ctx || {};
  const name = safeCtx.name || "клиента";
  const businessType = safeCtx.business_type || "неуточнен бизнес";

  return `Ти си AI Ментор на МАБИ — предприемаческа академия за собственици
на бизнес с 200,000+ лв. годишен оборот.
Стил: директен, конкретен, практичен. Без мотивационен speaker тон.
Казваш "ти". На български.
Не даваш финансов, правен или медицински съвет.
Ако въпросът е извън бизнес темите — отклони учтиво.

Контекст за потребителя:
- Име: ${name}
- Тип бизнес: ${businessType}`;
}

module.exports = { askMentor, buildSystemPrompt };
