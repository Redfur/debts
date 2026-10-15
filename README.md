# Долги

Offline-first PWA-приложение для учёта долгов между пользователем и другими людьми: кто кому должен, история операций по каждому долгу, итоги в выбранной валюте отображения. Данные хранятся в **IndexedDB** в браузере, без бэкенда; единственный сетевой запрос — курс валют (не чаще раза в сутки, с офлайн-фолбэком).

## Стек

React 19, Vite 8, TypeScript, Zustand, react-router-dom, react-i18next, Tailwind CSS 4, shadcn/ui (Radix), IndexedDB через `idb`, PWA (`vite-plugin-pwa`).

## Установка зависимостей

В корне репозитория задан [`.npmrc`](.npmrc) с `legacy-peer-deps=true`: **`vite-plugin-pwa`** пока объявляет в `peerDependencies` только Vite до 7, тогда как проект на **Vite 8**. Флаг ослабляет проверку peer у npm и позволяет установить дерево зависимостей без ошибки `ERESOLVE`.

```bash
npm install
```

## Команды

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Режим разработки |
| `npm run build` | Сборка (`tsc -b` + Vite) |
| `npm run preview` | Просмотр production-сборки |
| `npm run check` | Biome: линт и форматирование |
| `npm run check:fix` | То же с автоисправлением |
| `npm run knip` | Поиск неиспользуемых экспортов и файлов (см. `knip.json`) |
| `npm run spec:validate` | Проверка спецификаций и активных изменений OpenSpec (`openspec validate --all --strict`) |
| `npm run release -- <версия>` | Проверки и создание тега релиза (см. `scripts/release.sh`) — требует git remote |

## Резервная копия данных

В **Настройках** доступен локальный backup/restore без сервера: экспорт JSON (`debts-backup-YYYY-MM-DD.json` — контакты, долги, операции, `meta`) и импорт с подтверждением перед полной заменой данных в IndexedDB. Не отправляет данные в сеть.

## Курс валют

Источник — публичный бесплатный [`@fawazahmed0/currency-api`](https://github.com/fawazahmed0/exchange-api) (без ключа, ежедневное обновление). Обновляется в приложении не чаще раза в сутки; при недоступности сети используется последний закэшированный курс.

## Релизы и деплой

1. Обновите [CHANGELOG.md](CHANGELOG.md): секция `## [X.Y.Z] - дата` (версия **без** префикса `v`) с описанием релиза; перенесите пункты из `## [Unreleased]`.
2. Выставьте ту же версию в поле `version` в [package.json](package.json).
3. Закоммитьте изменения.
4. Запустите **`npm run release -- X.Y.Z`** (например `npm run release -- 0.1.0`). Скрипт [scripts/release.sh](scripts/release.sh) проверит секцию в CHANGELOG, совпадение версии с `package.json`, отсутствие тега, чистое git-дерево, выполнит `npm run check` и `npm run knip`, создаст тег `vX.Y.Z` и запушит его. Проверка без тега: `npm run release -- X.Y.Z --dry-run`.
5. Workflow **[`.github/workflows/release.yml`](.github/workflows/release.yml)** по push тега `v*.*.*` создаёт GitHub Release и деплоит на GitHub Pages.

Перед первым релизом включите Pages в репозитории: **Settings → Pages → Source: GitHub Actions**.

## Документация и процесс разработки

Изменения ведутся через [OpenSpec](https://github.com/Fission-AI/OpenSpec) (spec-driven development):

- **[`openspec/specs/`](openspec/specs)** — источник истины о поведении продукта, по capability: `app-shell`, `contacts`, `dashboard`, `data-management`, `debts`, `exchange-rates`, `repayments`.
- **[`openspec/changes/`](openspec/changes)** — предлагаемые и активные изменения (proposal → specs-дельта → design → tasks); после реализации архивируются в `changes/archive/`, а дельты вливаются в `specs/`.
- **[`openspec/config.yaml`](openspec/config.yaml)** — контекст проекта и правила для артефактов.

Цикл работы (Claude Code — `/opsx:…`, Cursor — `/opsx-…`):

1. `/opsx:explore` — обсудить идею (по желанию).
2. `/opsx:propose "<идея>"` — создать изменение со всеми артефактами; ревью.
3. `/opsx:apply` — реализовать по `tasks.md`.
4. `/opsx:archive` — после мержа влить дельты в `openspec/specs/` и архивировать изменение.

CLI доступен локально: `npx openspec list`, `npx openspec show <spec>`, `npx openspec view`. Обновить сгенерированные скиллы/команды после обновления пакета: `npx openspec update`.

Справочные документы:

- [docs/architecture.md](docs/architecture.md) — как устроен код (FSD, стор, хранилище, курс валют, NFR)
- [docs/domain.md](docs/domain.md) — термины и модель данных
- [docs/coding-standards.md](docs/coding-standards.md) — правила кода и FSD
- [docs/design-system.md](docs/design-system.md) — дизайн-система: токены, типографика, компоненты, иконка
- [docs/design-brief.md](docs/design-brief.md) — бриф на редизайн
- [docs/roadmap.md](docs/roadmap.md) — бэклог идей

Прежняя документация `spec/*.md` заменена на OpenSpec; её последняя версия доступна в истории git (коммит `bda79a7`).
