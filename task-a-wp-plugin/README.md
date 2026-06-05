# Задача A — MABI Member API (WordPress плъгин)

WordPress плъгин, който регистрира REST endpoint за обобщени данни на член.

**Endpoint:** `GET /wp-json/mabi/v1/member/{user_id}`

| Файл | Какво е |
|------|---------|
| `mabi-member-api/mabi-member-api.php` | плъгинът |
| `tests/test-member-api.php` | unit тестове (бонус) |
| `tests/bootstrap.php`, `phpunit.xml.dist` | конфигурация за тестовете |

---

## Какво връща (200)

```json
{
  "user_id": 123,
  "display_name": "Иван Петров",
  "membership_active": true,
  "membership_level": "level_2",
  "membership_expires": "2026-12-31",
  "courses_completed": 4,
  "courses_total": 8,
  "last_login": "2026-05-28T14:32:00",
  "days_member": 187
}
```

## Достъп и статус кодове

| Случай | Код |
|--------|-----|
| Нелогнат потребител | **401** |
| Логнат, но чужд `user_id` и не е admin | **403** |
| `user_id` не съществува | **404** |
| Логнат за свои данни, или admin за всеки | **200** |

## Реализация

- Auth: `is_user_logged_in()` (401), сравнение с `get_current_user_id()` + `current_user_can( 'manage_options' )` за admin (403).
- `display_name` и `days_member` идват от реалния потребител; `membership_*`, `courses_completed`, `last_login` са **mock** — usermeta с fallback стойност (без реална LMS логика, както допуска заданието).
- Следва WordPress Coding Standards (префиксирани функции, escape, без директен достъп).

---

## Инсталация

1. Копирай папката `mabi-member-api/` в `wp-content/plugins/` на WordPress инсталацията.
2. **WP Admin → Plugins** → активирай **„MABI Member API"**.

## Тестване с curl

Endpoint-ът изисква автентикация. Най-лесно с **Application Password**:

1. **WP Admin → Users → Profile → Application Passwords** → въведи име → **Add New Application Password** → копирай генерираната парола.
2. Извиквай с HTTP Basic Auth (`-k` пропуска проверката на локалния self-signed SSL):

```bash
# 200 — свои данни (admin е обикновено user 1)
curl -k -u "admin:APP_PASSWORD" https://mabi.local/wp-json/mabi/v1/member/1

# 401 — без автентикация
curl -k https://mabi.local/wp-json/mabi/v1/member/1

# 404 — несъществуващ потребител
curl -k -u "admin:APP_PASSWORD" https://mabi.local/wp-json/mabi/v1/member/999999

# 403 — не-admin потребител иска чужди данни
curl -k -u "member:APP_PASSWORD" https://mabi.local/wp-json/mabi/v1/member/1
```

---

## Бонуси

- **Кеширане с transient** за 5 минути (`get_transient` / `set_transient`) — намалява повтарящата се работа при чести заявки за същия потребител.
- **Unit тестове** с `WP_UnitTestCase` (`tests/`): 401, 200 (свои данни), 403, 404.

### Пускане на тестовете

Изисква WordPress PHPUnit тестовата среда (стандартната `wordpress-tests-lib`):

```bash
# 1) Инсталирай тестовата библиотека — напр. стандартния WP скрипт install-wp-tests.sh,
#    който се генерира от: wp scaffold plugin-tests mabi-member-api
# 2) Посочи WP_TESTS_DIR (ако не е на default локация) и пусни:
phpunit
```

`tests/bootstrap.php` зарежда плъгина в тестовата среда; `phpunit.xml.dist` я конфигурира.

---

## Какво бих добавил с повече време

- Реална LMS интеграция вместо mock полетата (`courses_completed`, `membership_*` от Tonkin LMS).
- Инвалидиране на transient кеша при промяна на потребителя (`profile_update` / `set_user_role` hooks).
- Дефиниран `schema` за REST отговора (типове + валидация на изхода).
- Покритие с още тестове (невалиден `user_id`, кеш hit/miss).
- Rate limiting на endpoint-а.
