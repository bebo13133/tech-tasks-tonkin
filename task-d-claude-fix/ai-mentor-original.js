// ai-mentor.js — ОРИГИНАЛНА (СЧУПЕНА) ВЕРСИЯ
// Запазена непроменена за reference. Поправената версия е в ai-mentor.js.
//
// Контекст: AI Mentor-ът беше на OpenAI. Опит за миграция към Claude →
// кодът е тук, но е деактивиран, защото "Claude не зачита части от
// промптовете" и връща неочаквани отговори.

const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function askMentor(userQuestion, userContext) {
  const systemPrompt = buildSystemPrompt(userContext);

  // Опит за Claude интеграция — НЕ РАБОТИ ПРАВИЛНО
  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuestion },
    ],
  });

  // Взима отговора по OpenAI начин
  return response.choices[0].message.content;
}

function buildSystemPrompt(ctx) {
  return `Ти си AI Ментор. Помагай на потребителя.
Клиент: ${ctx.name}, бизнес: ${ctx.business_type}.
Отговаряй на български.`;
}

module.exports = { askMentor };
