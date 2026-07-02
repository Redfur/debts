---
name: debts-development
description: Разработка приложения «Долги» по спецификациям. Использовать при реализации фич, рефакторинге или когда пользователь просит разработать/реализовать что-то в проекте debts.
---

# Разработка «Долги»

## Перед началом

1. **Прочитать релевантные спецификации** в `spec/`:
   - spec/README.md — индекс документов (корень репозитория)
   - spec/solution-overview.md — поток работы и сценарии
   - spec/requirements.md — MVP, user stories, edge cases
   - spec/concepts.md — термины (Contact, Debt, DebtOperation, направление, валюта отображения)
   - spec/domain.md — доменные модели, примеры данных
   - spec/ui.md — экраны и компоненты
   - spec/architecture.md — FSD-слои, Zustand (`useDebtStore`), StorageAdapter, курс валют
   - spec/non-functional.md — производительность, offline, точность денежных сумм

2. **Проверить правила кода** в docs/coding-standards.md:
   - FSD: app → pages → widgets → features → entities → shared
   - Публичный API через index.ts
   - Локализация: переводы внутри слайса, injectTranslation, useTranslation

## Workflow

1. Определить, в какой слой/слайс помещается код
2. Создать структуру по FSD (ui, model, api и т.д.)
3. Реализовать, сверяясь со спецификацией
4. Добавить переводы в слайс (translations.ts, TRANS_NS)
5. **Changelog** — заметные улучшения UX и поведения добавлять в `CHANGELOG.md` (раздел `[Unreleased]`) вместе с кодом
6. **Актуализировать спецификацию** — при любых изменениях обновлять spec/
7. Запустить `npm run check` перед завершением (при необходимости `npm run build` для проверки типов)

## Стек

- shadcn + Tailwind — UI. Компоненты в `src/components/ui/`, импорт: `@/components/ui/...`
- **Формы и контролы:** не использовать в слайсах голые `<input>`, `<select>`, `<textarea>`, нативные checkbox/radio, если есть shadcn-аналог. Порядок: (1) `src/components/ui/`, (2) `npx shadcn@latest add <component>` (если недоступен реестр — написать вручную по стилю существующих компонентов, как `dialog.tsx`/`command.tsx`/`textarea.tsx`), (3) только при отсутствии аналога — свой компонент.

## Ключевые решения (из spec)

- IndexedDB (через `idb`) + абстракция `StorageAdapter` в shared: сторы `contacts`, `debts`, `debtOperations`, `meta` (с `ratesCache`)
- Zustand — `useDebtStore` в `src/entities/debt/model/debt-store.ts` (контакты + долги + операции + курс валют в одном сторе)
- Денежные суммы — всегда через `roundAmount`/`formatAmount` (`shared/lib`)
- Курс валют — `shared/lib/exchange-rate`, обновление не чаще раза в сутки, офлайн-фолбэк на кэш
- react-i18next, колоцированные переводы, только `ru`
- Offline-first; единственный сетевой запрос — курс валют
