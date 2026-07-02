# Правила написания кода

## Спецификация

**Все изменения в коде должны отражаться в спецификации** (`spec/`):

- Добавили фичу — обновите requirements.md, ui.md и т.д.
- Реализовали что-то — отметьте в соответствующем spec-файле.
- Удалили или изменили — обновите spec.

## Feature-Sliced Design (FSD)

Проект использует [Feature-Sliced Design](https://feature-sliced.github.io/documentation/ru/) для организации кода. Цель — минимизировать разбросанность, чётко разделить ответственность, упростить навигацию.

### Правило импорта

Модуль может импортировать только из слоёв **строго ниже**. Исключение: `app` и `shared` могут импортировать друг друга.

```
app → pages → widgets → features → entities → shared
```

### Структура src/

```
src/
├── components/          # shadcn UI-компоненты (Button, Input и т.д.)
│   └── ui/              # импорт: @/components/ui/...
├── app/                 # Точка входа, провайдеры
│   ├── providers/
│   └── styles/
├── pages/               # Страницы приложения
├── widgets/             # Крупные самодостаточные блоки UI
├── features/           # Действия пользователя (переиспользуемые)
├── entities/           # Бизнес-сущности (в т.ч. Zustand store рядом с доменом, см. pushup)
└── shared/             # Переиспользуемый код без бизнес-логики
    ├── lib/             # Утилиты, хелперы, injectTranslation
    ├── layout/          # Каркас экрана: PageHeader, ScreenBody (импорт @/shared/layout)
    ├── api/             # API-клиент (если есть бэкенд)
    ├── config/          # Конфигурация
    └── i18n/            # Глобальные переводы (cancel, save и т.д.)
```

### Сегменты внутри слайса

| Сегмент | Назначение |
|---------|------------|
| `ui` | Компоненты, отображение |
| `model` | Состояние, бизнес-логика, типы |
| `api` | Запросы к внешним API |
| `lib` | Вспомогательный код слайса |
| `config` | Конфигурация слайса |

### Модальные окна

- Для модальных окон использовать `@ebay/nice-modal-react` (`NiceModal.create`, `NiceModal.show`, `useModal`).
- Утилитарные модалки (общий confirm/alert без предметной логики) размещать в `src/shared/ui/modals/`.
- Предметные модалки размещать в соответствующем слайсе:
  - `features/<slice>/ui/` — для feature-логики
  - `widgets/<slice>/ui/modals/` — для widget-логики
- Повторно используемые сценарии открытия модалок выносить в функции-хелперы и экспортировать через публичный API слайса.

### Публичный API

Каждый слайс экспортирует наружу только через `index.ts` (или `index.tsx`). Внутренняя структура — деталь реализации.

```
entities/some/
├── model/
│   ├── types.ts
├── ui/
│   └── Component.tsx
└── index.ts          # export { ... } — только то, что нужно снаружи
```

Импорт снаружи: `import { LineRow } from "@/entities/some"`, не `from "@/entities/some/ui/Component"`.

---

## Общие правила

### TypeScript

- Строгая типизация, избегать `any`
- Интерфейсы для публичных контрактов
- Типы в `model/` или рядом с использованием
- **Не использовать `as` там, где это не нужно** — полагаться на вывод типов и перегрузки; `as` только когда типы API не позволяют иначе

### React

- Функциональные компоненты
- Хуки для переиспользуемой логики
- Компоненты в `ui/`, логика в `model/` или хуках

### Стили и UI

- **Tailwind + shadcn** — основа стилей и компонентов
- Добавление: `npx shadcn@latest add <component>`
- Компоненты в `src/components/ui/` (настроено в `components.json`)
- Импорт: `@/components/ui/button`, `@/components/ui/input` и т.д.
- В фичах/виджетах/страницах не использовать голые `<input>`, `<select>`, `<textarea>` и нативные checkbox/radio, если есть компонент в `src/components/ui/`; если нет — добавить через `npx shadcn@latest add …`; свой компонент — только если в реестре shadcn нет аналога
- Без inline-стилей, кроме динамических значений
- Глобальные стили в `app/styles/`

### Именование

- Компоненты: PascalCase
- Файлы компонентов: PascalCase (LineRow.tsx)
- Хуки: camelCase с префиксом `use`
- Утилиты, типы: camelCase / PascalCase по контексту
- Папки: kebab-case (note-sidebar, notebook-editor)

### Biome

- Линтинг и форматирование через Biome
- `npm run check` перед коммитом
- Не отключать правила без явной причины (с комментарием)

### Локализация (react-i18next)

Переводы **колоцированы** со слайсами: каждый слайс (feature, widget, page, entity) содержит свой файл переводов.

**Структура слайса:**

```
features/save-note/
├── ui/
│   └── SaveButton.tsx
├── translations.ts      # { ru: { save: 'Сохранить' }, ... }
├── constants.ts         # export const TRANS_NS = 'save-document'
└── index.ts             # injectTranslation(TRANS_NS, translations); export ...
```

**Инжект в index.ts:**

```ts
import { injectTranslation } from "@/shared/lib/i18n";
import { translations } from "./translations";

export const TRANS_NS = "save-note";

injectTranslation(TRANS_NS, translations);

export { SaveButton } from "./ui/SaveButton";
```

**Использование в компонентах:**

```ts
import { useTranslation } from "react-i18next";
import { TRANS_NS } from "..";

const { t } = useTranslation(TRANS_NS);
return <button>{t("save")}</button>;
```

**Правила:**

- **Глобальный namespace** (`common` или `shared`) — для cancel, save, delete и других общих строк
- **Слайс-специфичный namespace** — для строк, уникальных для фичи/виджета/страницы
- Один слайс — один namespace (TRANS_NS)
- Файл `translations.ts`: `{ ru: Record<string, string>, ... }`
- Не хардкодить текст в компонентах

**Глобальные переводы:** `shared/i18n/` — общие строки (cancel, save, delete и т.д.), используемые в разных слайсах. Отдельный namespace, инжектится при инициализации приложения.

**Общая настройка:** `shared/lib/i18n` — экземпляр i18n, `injectTranslation()`, провайдер в `app/providers`.
