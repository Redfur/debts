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
5. Workflow **[`.github/workflows/release.yml`](.github/workflows/release.yml)** по push тега `v*.*.*` создаёт GitHub Release, деплоит на GitHub Pages и публикует версионный контейнер в GHCR.

Перед первым релизом включите Pages в репозитории: **Settings → Pages → Source: GitHub Actions**.

## Контейнер и GHCR

[Dockerfile](Dockerfile) собирает текущее содержимое checkout: Node 22 устанавливает зависимости из lock-файла и создаёт production-сборку, затем nginx отдаёт только `dist`. Версия исходников определяется checkout релизного тега перед сборкой. В образе приложение работает из корня домена (`VITE_BASE_PATH=/`), независимо от базы GitHub Pages.

В релизном workflow задача `container` запускается после успешных проверок и сборки `build`. При push тега `vX.Y.Z` она берёт исходники именно этого тега, проверяет совпадение с версией `package.json`, собирает Linux/amd64-образ и публикует **`ghcr.io/redfur/debts:vX.Y.Z`** и **`ghcr.io/redfur/debts:latest`**. Ручной запуск существующего release-workflow с полем `tag` также публикует оба тега. `latest` указывает на последнюю успешную публикацию, включая ручную пересборку старого релиза, а не обязательно на максимальную версию. Тег должен включать Dockerfile и конфиг nginx; старые теги до добавления контейнерных файлов так собрать нельзя.

Авторизация публикации использует встроенный `GITHUB_TOKEN`, разрешение `packages: write` ограничено задачей `container`. Отдельный токен для CI не требуется. После первой публикации проверьте видимость пакета в GHCR: для анонимного скачивания на сервере пакет должен быть **public**. Для private-пакета нужен `docker login ghcr.io` с доступом на чтение пакета. Публикация образа не обновляет контейнеры на серверах автоматически.

### Запуск опубликованной версии

На сервер достаточно скопировать [compose.yaml](compose.yaml); исходники приложения и Node там не нужны. Рядом создайте `.env` с выбранной **уже опубликованной** версией, например:

```ini
DEBTS_VERSION=v2.3.1
DEBTS_PORT=8080
```

```bash
docker compose pull debts
docker compose up -d --wait
```

Версия обязательна: без `DEBTS_VERSION` Compose остановится. Обновление или откат — изменить версию в `.env`, затем повторить эти две команды. Для последней опубликованной сборки задайте `DEBTS_VERSION=latest` и при обновлении повторяйте `pull` и `up`: работающий контейнер сам не обновляется. В runtime нет серверной БД или тома с пользовательскими данными: они остаются в IndexedDB браузера. При смене домена используйте экспорт/импорт данных в приложении.

Приложение опубликовано только на `127.0.0.1:8080` (порт настраивается через `DEBTS_PORT`). Внешний nginx завершает HTTPS и передаёт запросы на этот адрес; для selfsteal Xray принимает публичный TCP/443 и направляет обычный HTTPS в этот nginx. Открывать порт приложения в firewall не требуется. Для установки PWA и service worker нужен HTTPS либо localhost.

[nginx.conf](nginx.conf) поддерживает прямое открытие SPA-маршрутов. Отсутствующие ресурсы возвращают 404; HTML и service worker перепроверяются, хешированные файлы в `/assets/` кешируются надолго. В образе есть healthcheck, в Compose ограничен размер логов.

### Локальная проверка Dockerfile

```bash
docker build -t debts:local .
docker run --rm -p 127.0.0.1:8080:80 debts:local
```

Откройте `http://localhost:8080`. Для сборки локально именно релизного тега используйте отдельный checkout/worktree этого тега и выполните `docker build` из него. В CI checkout тега выполняется автоматически.

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
