# Задача D — Поправка на Claude интеграцията (`ai-mentor.js`)

**Stack:** Node.js + `@anthropic-ai/sdk`
**Статус:** ✅ Поправена

AI Ментор-ът на МАБИ работеше на OpenAI. При миграцията към Anthropic Claude
кодът беше написан, но деактивиран, защото *„Claude не зачита части от
промптовете"* и връщаше неочаквани отговори.

Причината не е в Claude — а в това, че кодът викаше Anthropic API-то по
**OpenAI начин**. Двата SDK-а изглеждат подобни, но се различават в три
ключови точки, и точно те бяха сгрешени.

| Файл | Какво е |
|------|---------|
| `ai-mentor-original.js` | Оригиналният счуупен код (непроменен, за reference) |
| `ai-mentor.js` | Поправената версия с inline коментари `ГРЕШКА #N` |

---

## 🔴 Намерените грешки

### Грешка #1 — Невалиден модел
```js
model: "claude-opus-4-5"   // ❌ такъв модел не съществува
```
`claude-opus-4-5` не е валиден Claude идентификатор. API-то връща `404 /
not_found_error` още при извикването.

**Валидни модели (2026):**
- `claude-sonnet-4-6` — баланс цена/качество (ползваме този; заданието го иска и в Задача B)
- `claude-opus-4-7` — най-силен разсъждаващ модел
- `claude-haiku-4-5-20251001` — най-бърз/евтин

**Поправка:** изведено в константа `MODEL` (от env с fallback към `claude-sonnet-4-6`).

---

### Грешка #2 — `system` подаден като съобщение в `messages[]` ⭐ ГЛАВНАТА
```js
messages: [
  { role: "system", content: systemPrompt },  // ❌ Anthropic игнорира това
  { role: "user", content: userQuestion },
]
```
**Това е причината „Claude не зачита промптовете".**

В OpenAI Chat Completions system prompt-ът е първо съобщение в `messages`
с `role: "system"`. **Anthropic API не приема `role: "system"` вътре в
`messages[]`** — масивът е само за диалога (`user` / `assistant`). System
промптът се подава като **отделен top-level параметър** `system`.

Затова в оригинала инструкциите никога няма да достигнат  до модела — Claude
отговаряше без никакъв system prompt, оттам и „неочакваните" отговори.

**Поправка:**
```js
const response = await client.messages.create({
  model: MODEL,
  max_tokens: 1024,
  system: systemPrompt,                 // правилно
  messages: [{ role: "user", content: userQuestion }],
});
```

---

### Грешка #3 — Извличане на отговора по OpenAI формат
```js
return response.choices[0].message.content;   //  OpenAI 
```
OpenAI връща `choices[].message.content`. **Anthropic връща масив `content`
от блокове**, всеки със свой `type`; текстът е в `content[i].text`.

`response.choices` е `undefined` при Anthropic → `Cannot read properties of
undefined (reading '0')`.

**Поправка** (по-устойчива от твърдо `content[0].text` — Claude може да
върне няколко текстови блока):
```js
return response.content
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("");
```

---

### Грешка #4 — Никакъв error handling
Нямаше `try/catch`. Всяка мрежова грешка, rate limit (`429`), невалиден
ключ (`401`) или overload (`529`) хвърляше необработено изключение и
сриваше извикващия код. Грешка която и аз съм допускал 

**Поправка:** `try/catch` с лог (без чувствителни данни) и re-throw, за да
може API слоят над него (Задача B) да върне коректен `502`.

---

### Грешка #5 — Липсващ guard за контекста
```js
function buildSystemPrompt(ctx) {
  return `... Клиент: ${ctx.name} ...`;   //  срива ако ctx е undefineд
```
`user_context` е опционален (виж Задача B), но `ctx.name` хвърля
`TypeError` още преди API извикването, ако `ctx` липсва.

**Поправка:** `const safeCtx = ctx || {}` + fallback стойности за всяко поле.

---

### Допълнително — system prompt-ът беше отслабен
Оригиналният `buildSystemPrompt` връщаше обща инструкция („Ти си AI Ментор.
Помагай на потребителя."), без тона и ограниченията на МАБИ. Тъй като и
без това не достигаше до модела (Грешка #2), ефектът беше двоен.

Поправената версия връща пълния МАБИ system prompt (директен тон, „ти",
без финансов/правен/медицински съвет) + контекста на потребителя.

---

## 📊 OpenAI vs Anthropic Claude — разликите накратко

| | OpenAI (Chat Completions) | Anthropic Claude (Messages) |
|---|---|---|
| SDK | `openai` | `@anthropic-ai/sdk` |
| Извикване | `client.chat.completions.create()` | `client.messages.create()` |
| **System prompt** | съобщение `{role:"system"}` в `messages[]` | **отделен top-level `system`** |
| Роли в `messages[]` | `system`, `user`, `assistant` | само `user`, `assistant` |
| `max_tokens` | опционален | **задължителен** |
| Формат на отговора | `choices[0].message.content` (string) | **`content[]` масив от блокове** → `content[0].text` |
| Грешка overload | `429` | `429` + специфичен `529 overloaded_error` |

**Изводът:** трите счупени реда (`model`, `system`-в-`messages`,
`choices[0]...`) са точно местата, където OpenAI и Anthropic се разминават.
Кодът беше copy-paste от OpenAI с подменен само SDK импорта на Anthropic.

---

## ✅ Какво бих добавил с повече време

- **Retry с exponential backoff** за `429` / `529` (вградено в SDK чрез `maxRetries`, или ръчно).
- **Prompt caching** на system prompt-а (`cache_control`) — при стабилен system prompt спестява tokens и латентност.
- **Структурирана валидация** на входа (Zod) преди извикването.

### Опциално според изискванията и нуждите:
- **Streaming** вариант (`client.messages.stream`) за по-добър UX в реалния chatbot.
- **Unit тест** с мокнат `client.messages.create`, който проверява, че `system` се подава top-level, а не в `messages[]`.

---

## 🧪 Как да се тества локално

> Поправката не изисква жив API ключ, за да се прочете коректността — но за реално извикване:

```bash
npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-ant-...        # Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."

node -e "require('./ai-mentor').askMentor('Как да вдигна цените си?', {name:'Иван', business_type:'консултантски услуги'}).then(console.log)"
```

Очакван резултат: текстов отговор на български, в директния тон на МАБИ.
