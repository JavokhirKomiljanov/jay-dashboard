# Недельное авто-обновление досье «Клиенты» (JOS → Продажи → 🏢 Клиенты)

**Что:** `scripts/refresh_clients_weekly.py` (обёртка `agents/clients/run_client_refresh.ps1`) — раз в неделю на ноутбуке, headless `claude -p` (Max plan, Sonnet, без API-ключей), один вызов на клиента.
**Владелец обновления:** Claude Code (этот скрипт) → результат смотрит Jay в Obsidian `W2W/CRM/Клиенты — изменения.md`.
**Публикация:** не здесь — её делает существующая задача `\JOS\jos-sales-ig-refresh` (09/14/19:30), она подхватит изменённые досье.

## Как работает
1. Python на клиента собирает файлы НОВЕЕ последнего прохода (state `data/jos/clients_refresh_state.json`, первый раз — 2026-10-17), которые про клиента: имя/алиасы (только уникальные), @ники, люди клиента, привязанные CRM-лиды, уже процитированные в досье файлы. Источники: Feed/Meetings, W2W/Meetings, Companies, Telegram/Topics, Projects, People, Feed/Sessions, W2W/Sales, memory `project_*.md`, папки КП в `C:\Users\user\Claude`. Производные файлы (FACTBASE, brain.json, advisors/out, JOS-json) и «обзорные» (упоминают ≥6 клиентов) отбрасываются. Нет новых файлов → вызова модели нет.
2. Модель отдаёт ПАТЧ, не досье. Каждый пункт = `src` + дословная `quote`; Python проверяет, что файл есть, в списке и цитата реально в нём; числа ≥3 знаков из текста должны быть в файле; иначе пункт отбрасывается (виден в отчёте как ⛔).
3. Применение append-only: timeline / kps / people / open_questions / sources добавляются (`auto: <дата>`); status / next_step / group заменяются, старое значение — в `history`. `money`, `contracts`, исходы существующих КП, `summary` и поля из `locked` НЕ правятся — идут в отчёт как 🔶 предложения. Заметки Jay («Мои заметки» в карточке) читаются как приоритетный источник.
4. Метки: из Claude-сессий и memory новые факты автоматически получают ⚠️, не ✅.
5. Новые клиенты: папки КП/ТЗ в `C:\Users\user\Claude`, Companies/client-chat без досье → один вызов «discover» → досье группы «Переговоры» с `auto_added`, в отчёте блок 🆕.
6. Бэкап изменённого JSON → `data/jos/clients/_history/<дата>/`; сырой ответ модели → `data/logs/clients_raw/<дата>/`; лог `data/logs/refresh_clients_weekly.log`.

## Запуск
- Тест на копии: `powershell -File agents\clients\run_client_refresh.ps1 -DryRun -Ids transexp,smeta,argroup` (пишет в `data/jos/clients_dryrun/`, живое не трогает; `--simulate-stale 2` в python-вызове — тест «забыть и найти заново»).
- Боевой: `powershell -File agents\clients\run_client_refresh.ps1` (весь список, ~25 мин, большинство клиентов без вызова).
- Запланировано (ОК Jay 10-17): Windows Task `\JOS\jos-clients-weekly`, пн 07:00, StartWhenAvailable, ноутбук; первый запуск 10-19.

## Ограничения
- Telegram-дампы клиентских чатов в vault заморожены (Topics — 08-12, Companies — 09-25): живые чаты сюда не попадают, только CRM-лиды, встречи (Feed/Meetings, Read.ai), сессии Claude, memory, файлы КП.
- Правки в JOS (localStorage) не синхронизируются — скрипт их не видит; для Jay-фактов использовать «Мои заметки» в Obsidian или `locked` в JSON.
- Цитата подтверждает опору, но не каждое слово `text` — поэтому отчёт показывает src и цитату, а метки из сессий ⚠️.
