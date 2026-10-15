# Долги — инструкции для агентов

Offline-first PWA для учёта личных долгов. Интерфейс и документация — на русском.

- **Поведение продукта** — `openspec/specs/<capability>/spec.md`. Изменения поведения ведутся через OpenSpec: `/opsx:propose` → ревью → `/opsx:apply` → `/opsx:archive`. Мелкий фикс без изменения наблюдаемого поведения — без change.
- **Как устроен код** — `docs/architecture.md`; термины и модель данных — `docs/domain.md`; правила кода (FSD, i18n, модалки, shadcn) — `docs/coding-standards.md`; редизайн — `docs/design-brief.md`; бэклог — `docs/roadmap.md`.
- Пользовательские изменения — в `CHANGELOG.md` (`[Unreleased]`) в том же коммите.
- Перед коммитом: `npm run check`, `npm run knip`, `npm run spec:validate`, `npm run build`.
