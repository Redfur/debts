# Архитектура

## Feature-Sliced Design (привязка к репозиторию)

| Слой | Папка | Роль в Долгах |
|------|--------|-----------------|
| App | `src/app/` | Провайдеры (i18n, theme, NiceModal), инициализация store, подключение persistence |
| Pages | `src/pages/` | `/` (главная), `/contacts/:contactId`, `/settings` |
| Widgets | `src/widgets/` | `home-screen`, `contact-detail`, `settings-screen` |
| Features | `src/features/` | `select-contact`, `create-debt`, `add-repayment`, `set-display-currency`, `refresh-exchange-rates`, `pwa-app-update` |
| Entities | `src/entities/` | `debt` (Contact/Debt/DebtOperation, Zustand store, `computeDebtBalance`/`computeContactSummary`/`computeGlobalTotals`, `ContactAvatar`) |
| Shared | `src/shared/` | `lib/` (id, theme, **storage**, **exchange-rate**, `currency-preference`, `format-amount`, `round-amount`), `config/` (`currencies`, `contact-colors`), `i18n`, `layout/` |
| UI-kit | `src/components/ui/` | shadcn — без бизнес-логики (в т.ч. `dialog`, `command`, `textarea`, добавленные вручную под этот проект) |

Импорт: только снизу вверх по слоям; `app` и `shared` — по правилам проекта (см. `docs/coding-standards.md`).

## Размещение слайсов

| Слайс | Путь |
|-------|------|
| Домен долгов (типы, стор, агрегаты) | `src/entities/debt/` |
| Поиск/создание контакта | `src/features/select-contact/` |
| Создание долга | `src/features/create-debt/` |
| Погашение долга | `src/features/add-repayment/` |
| Валюта отображения | `src/features/set-display-currency/` |
| Обновление курса валют | `src/features/refresh-exchange-rates/` |
| Главная | `src/widgets/home-screen/` |
| Карточка контакта | `src/widgets/contact-detail/` |
| Настройки | `src/widgets/settings-screen/` |

Публичный API каждого слайса — только через `index.ts`.

## Модальные окна

- Утилитарная модалка (подтверждение удаления долга, сброс данных) — `src/shared/ui/modals/ConfirmActionModal`.
- Модалки с доменной логикой — в своих фичах: `features/create-debt/ui/CreateDebtDialog.tsx`, `features/add-repayment/ui/AddRepaymentDialog.tsx` (обе — `NiceModal.create` + shadcn `Dialog`, не `AlertDialog`, так как содержат форму).
- Глобальный провайдер модалок (`NiceModal.Provider`) — в `app/providers`.

## State management: Zustand

**Расположение:** `src/entities/debt/model/debt-store.ts` (`useDebtStore`) — один стор на связанный домен (контакты + долги + операции + кэш курса), чтобы `features` не импортировали `app`.

**Структура состояния**

- `contactsById`, `debtsById` — записи после гидратации из IndexedDB
- `operationsByDebtId: Record<debtId, DebtOperation[]>` — отсортированы по `createdAt`
- `ratesCache: ExchangeRatesCache | null` — курс валют, персистится в `meta`
- `ratesFetchError: string | null` — мягкая ошибка обновления курса (не блокирует UI, не путается с `lastError`)
- `hydrated: boolean` — гидратация завершена (успех или ошибка чтения)
- `lastError: string | null` — последняя ошибка storage / операций

**Actions:** `hydrate()`, `getOrCreateContact(name)`, `createDebt(input)`, `addRepayment(debtId, amount, note?)`, `deleteDebt(id)`, `refreshRatesIfStale(force?)`, `clearError()`. Запись в IDB — после оптимистичного обновления памяти, с откатом при ошибке.

Агрегаты **не** в сторе: `computeDebtBalance`, `computeContactSummary`, `computeGlobalTotals` — чистые функции в `entities/debt/model/`, вызываются в UI через `@/entities/debt`.

## Персистентность

**IndexedDB** (`src/shared/lib/storage/`, БД `debts`): сторы `contacts`, `debts` (индекс `by-contactId`), `debtOperations` (индекс `by-debtId`), `meta` (`schemaVersion` + `ratesCache`). Удаление долга (`deleteDebt`) каскадно чистит его операции.

**localStorage** (не дублирует доменные данные): тема, валюта отображения — `src/shared/lib/client-storage-keys.ts` + `clear-client-storage.ts`.

**Backup/restore (JSON):** `src/shared/lib/storage/backup.ts` — `createDebtsBackup`/`parseDebtsBackup`/`restoreDebtsFromBackup`; полная замена данных через `wipeAppIndexedDatabase()` + запись payload (без Web Worker — объём данных для одного пользователя мал, парсинг на главном потоке не блокирует ощутимо).

**Курс валют:** `src/shared/lib/exchange-rate/` — `fetchExchangeRates()` (публичный бесплатный источник, без ключа), `convertAmount()`, `isRatesCacheStale()`. Не часть `StorageAdapter`-контракта домена — читается/пишется через `meta.ratesCache`.

**Будущее:** `ApiStorageAdapter` с тем же интерфейсом `StorageAdapter`; выбор адаптера в `app` при старте (env).

## Data flow

```
UI (pages/widgets)
    → feature (create-debt / add-repayment / …) вызывает action useDebtStore
        → Zustand store обновляет память (оптимистично)
            → StorageAdapter → IndexedDB
```

Курс валют — отдельный поток, не завязан на действия пользователя:

```
hydrate() → refreshRatesIfStale() (fire-and-forget)
    → fetchExchangeRates() (сеть) → store.ratesCache → meta.ratesCache (IndexedDB)
```

## Переиспользование существующего кода

- `@/components/ui/*` — карточки, кнопки, skeleton, progress, dialog, command
- `@/shared/lib/id.ts` — идентификаторы для новых `Debt`/`DebtOperation`/`Contact`
- `@/shared/lib/round-amount.ts`, `format-amount.ts` — денежные суммы
- `@/shared/config/currencies.ts` — список поддерживаемых валют, символы, лейблы
- `@/shared/i18n` — базовые ключи (`common`); новые строки — в слайсах через `injectTranslation`

## Тестируемость

- Чистые функции `computeDebtBalance` / `computeContactSummary` / `computeGlobalTotals` / `convertAmount` — unit-тесты без React.
- `StorageAdapter` — мок в тестах store.
