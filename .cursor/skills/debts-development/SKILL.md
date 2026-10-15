---
name: debts-development
description: Разработка приложения «Долги» по спецификациям. Использовать при реализации фич, рефакторинге или когда пользователь просит разработать/реализовать что-то в проекте debts.
---

# Разработка «Долги»

## Перед началом

1. **Поведение продукта** — в OpenSpec: `openspec/specs/<capability>/spec.md` (`app-shell`, `contacts`, `dashboard`, `data-management`, `debts`, `exchange-rates`, `repayments`). Активные изменения — `openspec/changes/`.
2. **Справка по коду**: `docs/architecture.md` (FSD, `useDebtStore`, StorageAdapter, курс валют, NFR), `docs/domain.md` (термины и модель данных), `docs/design-brief.md` (редизайн).
3. **Правила кода**: `docs/coding-standards.md` — FSD (app → pages → widgets → features → entities → shared), публичный API через `index.ts`, колоцированные переводы (`translations.ts`, `injectTranslation`, `useTranslation`).

## Workflow

1. Изменение поведения — через OpenSpec: `/opsx-propose` (создать change: proposal, specs-дельта, design, tasks) → ревью → `/opsx-apply` (реализация по `tasks.md`) → `/opsx-archive` (влить дельту в `openspec/specs/`). Мелкий фикс без изменения поведения — без change.
2. Определить слой/слайс FSD, создать структуру (ui, model, api…), реализовать.
3. Добавить переводы в слайс (translations.ts, TRANS_NS).
4. **Changelog** — заметные изменения UX и поведения в `CHANGELOG.md` (`[Unreleased]`) вместе с кодом.
5. Структура кода или модель данных поменялась — обновить `docs/architecture.md` / `docs/domain.md`.
6. Перед завершением: `npm run check`, `npm run knip`, `npm run spec:validate`, при необходимости `npm run build`.

## Стек

- shadcn + Tailwind — UI. Компоненты в `src/components/ui/`, импорт: `@/components/ui/...`
- **Формы и контролы:** не использовать в слайсах голые `<input>`, `<select>`, `<textarea>`, нативные checkbox/radio, если есть shadcn-аналог. Порядок: (1) `src/components/ui/`, (2) `npx shadcn@latest add <component>` (если недоступен реестр — написать вручную по стилю существующих компонентов, как `dialog.tsx`/`command.tsx`/`textarea.tsx`), (3) только при отсутствии аналога — свой компонент.

## Ключевые решения (см. docs/architecture.md)

- IndexedDB (через `idb`) + абстракция `StorageAdapter` в shared: сторы `contacts`, `debts`, `debtOperations`, `meta` (с `ratesCache`)
- Zustand — `useDebtStore` в `src/entities/debt/model/debt-store.ts` (контакты + долги + операции + курс валют в одном сторе)
- Денежные суммы — всегда через `roundAmount`/`formatAmount` (`shared/lib`)
- Курс валют — `shared/lib/exchange-rate`, обновление не чаще раза в сутки, офлайн-фолбэк на кэш
- react-i18next, колоцированные переводы, только `ru`
- Offline-first; единственный сетевой запрос — курс валют
