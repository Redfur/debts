# Долги

Локальное PWA-приложение для учёта долгов между пользователем и другими людьми: кто кому должен, история операций по каждому долгу, итоги в выбранной валюте отображения. Данные хранятся в **IndexedDB** в браузере, без бэкенда; единственный сетевой запрос — курс валют (не чаще раза в сутки, с офлайн-фолбэком).

Собрано на основе болванки [~/dev/empty-project](../empty-project), снятой с [pushlog](https://github.com/redfur/pushlog).

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
| `npm run release -- <версия>` | Проверки и создание тега релиза (см. `scripts/release.sh`) — требует git remote |

## Резервная копия данных

В **Настройках** доступен локальный backup/restore без сервера: экспорт JSON (`debts-backup-YYYY-MM-DD.json` — контакты, долги, операции, `meta`) и импорт с подтверждением перед полной заменой данных в IndexedDB. Не отправляет данные в сеть.

## Курс валют

Источник — публичный бесплатный [`@fawazahmed0/currency-api`](https://github.com/fawazahmed0/exchange-api) (без ключа, ежедневное обновление). Обновляется в приложении не чаще раза в сутки; при недоступности сети используется последний закэшированный курс.

## Релизы и деплой

Инфраструктура готова (`CHANGELOG.md` + `scripts/release.sh` + `.github/workflows/`), но неактивна без git remote — репозиторий пока локальный. Когда проект будет готов к публикации: создайте репозиторий на GitHub, добавьте remote, далее — тег → GitHub Actions → GitHub Release → GitHub Pages.

## Документация

- **Спецификации (источник сценариев и домена):** [spec/README.md](spec/README.md)
- **Правила кода и FSD:** [docs/coding-standards.md](docs/coding-standards.md)

При изменении поведения или структуры проекта обновляйте соответствующие файлы в `spec/`.
