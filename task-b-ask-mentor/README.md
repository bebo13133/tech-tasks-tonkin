# Задача B — AI Ментор API (Next.js + Claude)

API route, който приема бизнес въпрос (+ опционален контекст за клиента) и връща
отговор от Claude в стила на МАБИ.

**Endpoint:** `POST /api/ask-mentor`
**Модел:** `claude-sonnet-4-6` (конфигуруем през env)

| Слой | Файл |
|------|------|
| Endpoint | `app/api/ask-mentor/route.ts` |
| Логика (system prompt + Claude) | `lib/mentor.ts` |
| Rate limiting | `lib/rateLimit.ts` |
| Демо UI | `app/page.tsx` |

> Демо страницата (`/`) е надстройка за визуален тест; същинският deliverable е API route-ът.

---

## Стек

- **Next.js** (App Router, TypeScript)
- **@anthropic-ai/sdk** — официалният Anthropic SDK
- **react-markdown** — рендва отговора в демо UI-а

---

## Локално стартиране

```bash
# 1. Инсталирай зависимостите
npm install

# 2. Конфигурирай ключа
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
#    после отвори .env.local и попълни ANTHROPIC_API_KEY

# 3. Стартирай dev сървъра
npm run dev
```

Отвори **http://localhost:3000** за демо UI-а, или викай endpoint-а директно (виж по-долу).

### Env променливи (`.env.example`)

| Променлива | Задължителна | По подразбиране |
|------------|:---:|---|
| `ANTHROPIC_API_KEY` | ✅ | — |
| `ANTHROPIC_MODEL` | ➖ | `claude-sonnet-4-6` |

> `.env.local` (реалният ключ) **не се commit-ва** — игнориран е в `.gitignore`.

---

## API контракт

### Заявка
`POST /api/ask-mentor` · `Content-Type: application/json`

```json
{
  "question": "Как да вдигна цените си без да губя клиенти?",
  "user_context": {
    "name": "Иван",
    "business_type": "консултантски услуги",
    "monthly_revenue": "25000 €",
    "membership_days": 45,
    "last_completed_resource": "Margin Fix"
  }
}
```

- `question` — **задължително** (не празен текст).
- `user_context` — **опционален**; всяко поле в него също е опционално.

### Отговор `200`
```json
{ "answer": "..." }
```

### Грешки
| Код | Кога |
|-----|------|
| `400` | Липсва/празен `question`, невалиден JSON, или въпрос > 4000 символа |
| `429` | Надвишен rate limit (виж по-долу) — с хедър `Retry-After` |
| `502` | Грешка от Claude API |

---

## Тестване

### С curl

В проекта има готов `request.json` (примерно тяло) — просто го пусни:

```bash
curl -X POST http://localhost:3000/api/ask-mentor \
  -H "Content-Type: application/json" \
  --data-binary @request.json

# Бърза проверка за 400:
curl -X POST http://localhost:3000/api/ask-mentor \
  -H "Content-Type: application/json" \
  -d '{}'
```

> ℹ️ Ползваме файл (`--data-binary @request.json`) вместо инлайн `-d`, защото на
> Windows (Git Bash/PowerShell) инлайн кирилицата може да се развали — терминалът
> не запазва UTF-8. Файлът е чист UTF-8, затова минава коректно.

### С PowerShell
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/ask-mentor -Method Post `
  -ContentType "application/json" `
  -Body '{"question":"Как да вдигна цените си?"}'
```

### През UI
Отвори `http://localhost:3000`, напиши въпрос (по желание попълни контекст) и натисни „Попитай ментора". Отговорът се рендва форматиран; грешките (400/429/502) се показват като червено съобщение.

---

## Бонуси (имплементирани) ✅

**Rate limiting** — `lib/rateLimit.ts`: **10 заявки/минута на IP** (фиксиран прозорец).
При надвишаване → `429` + `Retry-After` хедър.

> **Production бележка:** хранилището е in-memory — работи за една инстанция. При
> няколко инстанции / serverless се ползва споделено хранилище (Redis/Upstash),
> за да е лимитът общ.

**Логване** — `route.ts` логва въпроса + дължината на отговора при всяка успешна
заявка, **без лични данни** (`user_context` умишлено не се логва).

---

## Какво бих добавил с повече време

- **Споделен rate-limit store** (Redis/Upstash) за multi-instance среда.
- **Тестове** на валидацията и rate limiter-а.
- **Streaming** за по-добър UX (заданието изрично не го изисква тук).
