# МАБИ — AI Dev тестово задание

Тестово задание за позицията AI Developer в МАБИ (Tonkin).
Автор: **Борислав Илиев** · Юни 2026.

Всяка задача е в собствена папка със свой README (инсталация, тест,
взети решения и обяснения).

| # | Задача | Stack | Папка | Статус |
|---|--------|-------|-------|--------|
| **A** | WP плъгин — `GET /wp-json/mabi/v1/member/{id}` | PHP / WordPress | [`task-a-wp-plugin/`](./task-a-wp-plugin) | ⬜ |
| **B** | Next.js route — `POST /api/ask-mentor` + Claude | Next.js | [`task-b-ask-mentor/`](./task-b-ask-mentor) | ⬜ |
| **C** | Миграционен план (3 сървъра, zero-downtime) | DevOps / архитектура | [`task-c-migration-plan/`](./task-c-migration-plan) | ⬜ |
| **D** | Поправка на счупена Claude интеграция | Claude API | [`task-d-claude-fix/`](./task-d-claude-fix) | ✅ |

> Задачи A, B, C са задължителни; D е бонус.

## Структура

```
mabi-test-assignment/
├── README.md                  ← този файл
├── task-a-wp-plugin/
├── task-b-ask-mentor/
├── task-c-migration-plan/
└── task-d-claude-fix/         ✅ готова
    ├── ai-mentor.js           ← поправена версия
    ├── ai-mentor-original.js  ← оригинал (за reference)
    └── README.md
```
