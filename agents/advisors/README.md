# Советники Jay — 4 агента

Chief of Staff (`cos`), HR-директор (`hr`), Маркетолог (`mkt`), Финансист (`fin`).
Каждый — один промпт (`<id>/SKILL.md`) + общий раннер `run_advisors.ps1`, который запускает
headless `claude -p` на Max-плане (никаких API-ключей), как это уже делает `\Jay\w2w-strategy-run`.

## Что делает запуск
1. Советник читает свои источники (strategy.json, vault, CRM-выгрузка, календарь — то, к чему дан доступ).
2. Пишет одну страницу: что изменилось · 3–7 задач с дедлайном и источником · что просрочено · один вопрос Jay.
3. Результат:
   - `out/<id>/<дата>.md` — страница;
   - `data/jos/advisors.json` → поле `tasks`/`kpis` советника обновляется (ключи задач стабильные: `<id>-N`);
   - Telegram-пинг Jay через Jay AI bot (тот же путь, что у стратега).
4. Советник **никогда не действует сам**: не пишет клиентам, не двигает деньги, не правит календарь, не публикует.

## Расписание (предложение)
| Советник | Когда | Почему |
|---|---|---|
| cos | Пн 08:30, Ср 17:30 | план недели; проверка «числа среды готовы?» перед C-Level 19:00 |
| fin | Ср 17:30; 5-го и 10-го | пять чисел среды; фонд к 5-му, выплаты к 10-му |
| hr | 5-го и 10-го | фонд и Debts по именам |
| mkt | Пн 08:30 | пост недели утверждён, стоп-лист сайта, источники лидов |

## Запуск на сервере (после доступов)
```
# один раз: скопировать репозиторий jay-dashboard на сервер (data/jos включительно)
# задача \Jay\advisor-<id> (S4U, как w2w-strategy-run):
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\user\Dev\jay-dashboard\agents\advisors\run_advisors.ps1 -Advisor cos
```
Публикация в JOS остаётся на ноутбуке: `python scripts/build_jos.py` → `scripts/publish.ps1`.

## Доступы, которых пока нет
- Google Calendar Jay (cos) — через коннектор claude.ai или экспорт .ics в `inputs/`.
- Выгрузка Jay CRM (mkt, cos) — `jay-crm` экспорт JSON в `inputs/crm.json`.
- Finance Dashboard / листы Salary и Debts (fin, hr) — файлы Nuriddin в `inputs/finance/`.
Без них советник работает только по strategy.json и vault и честно пишет «источник не подключён».
