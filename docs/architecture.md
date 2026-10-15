# Архитектура

Справочник по устройству кода. Поведение продукта (что система должна делать) описано в [`openspec/specs/`](../openspec/specs); здесь — как это реализовано. Термины и модель данных — в [domain.md](./domain.md), правила кода — в [coding-standards.md](./coding-standards.md), токены и компоненты интерфейса — в [design-system.md](./design-system.md).

## Стек

React 19, Vite 8, TypeScript, Zustand, react-router-dom, react-i18next, Tailwind CSS 4 (токены дизайн-системы в `src/index.css`, шрифт Onest), shadcn/ui (Radix), `@ebay/nice-modal-react`, IndexedDB через `idb`, PWA (`vite-plugin-pwa`), date-fns, Sonner (toasts). Бэкенда нет.

## Feature-Sliced Design (привязка к репозиторию)

| Слой | Папка | Роль |
|------|--------|------|
| App | `src/app/` | Провайдеры (i18n, NiceModal, Tooltip, гидрация стора, Toaster), роутинг (`AppRoutes`, lazy-страницы + `route-fallbacks` со скелетонами), каркас `app/layout` (`AppShell`, `BottomNav`, `CreateFab`, `SideNav`, `StorageErrorBanner`, `useShellMode` / `useSideNavSection`), `RouteErrorBoundary` |
| Pages | `src/pages/` | `home` (`/`), `create-debt` (`/new`), `create-bill` (`/bills/new`), `bill-detail` (`/bills/:billId`), `edit-bill` (`/bills/:billId/edit`), `contacts` (`/contacts`, раскладка «список + карточка» с `Outlet`), `contact-detail` (`/contacts/:contactId`), `settings` (`/settings`) |
| Widgets | `src/widgets/` | `home-screen` (в т.ч. секция «Счета»), `contacts-screen`, `contact-detail`, `bill-detail`, `settings-screen` |
| Features | `src/features/` | `select-contact` (`ContactPicker`, мультивыбор `ParticipantsPicker`), `create-debt`, `create-bill` (`BillForm`: создание, изменение, изменение после погашений; `PayerSheet`), `delete-bill` (`showDeleteBillConfirm`), `toggle-bill-closed`, `edit-debt`, `add-repayment`, `set-display-currency`, `refresh-exchange-rates`, `export-backup`, `import-backup`, `pwa-app-update` |
| Entities | `src/entities/` | `debt`: типы, Zustand-стор `useDebtStore`, хук `useDebtOperations`, агрегаты `computeDebtBalance` / `computeContactSummary` / `computeContactTotals` / `computeGlobalTotals` / `computeNetPosition` / `countContactsByDirection`, UI `ContactAvatar`, `ContactRow`, `AmountPill`, `DirectionChip`, `DirectionToggle`, `DebtStatusBadge`, `NetPositionLine`; счёт — `model/bill/` (расчёт, `useBillDebts`), UI `BillRow`, `BillMyPart`, `BillStatusBadge`, `TransferRow`, `BillLink`, `ParticipantAvatar` |
| Shared | `src/shared/` | `lib/` (storage, exchange-rate, theme, currency-preference, format-amount, format-date, round-amount, id, i18n, first-grapheme, use-online-status, use-keyboard-inset), `config/` (currencies, contact-colors), `i18n/` (`common`), `layout/` (`PageHeader`, `PageHeaderBackLink`, `ScreenBody`), `ui/` (`AmountField`, `CurrencyPicker`, `SearchField`, `HighlightMatch`, `EmptyState`, `form-message`, `money`, `modals/ConfirmActionModal`) |
| UI-kit | `src/components/ui/` | shadcn без бизнес-логики, перестроенный под дизайн-систему (кнопки-пилюли, `dialog` / `alert-dialog` как шторка на мобильном); добавлены вручную: `textarea`, `amount-input` (маска суммы), `badge`, `segmented-control` |

Импорт — только сверху вниз: `app → pages → widgets → features → entities → shared`; `app` и `shared` могут импортировать друг друга. Публичный API слайса — только `index.ts`.

## Маршруты

| Путь | Страница | Загрузка |
|------|----------|----------|
| `/` | `pages/home` → `widgets/home-screen` | eager |
| `/new[?contactId=]` | `pages/create-debt` → `features/create-debt` (`CreateDebtForm`) | lazy |
| `/contacts` | `pages/contacts` (index → `ContactsIndexPage`) → `widgets/contacts-screen` | lazy |
| `/contacts/:contactId` | вложен в `/contacts`: `pages/contact-detail` → `widgets/contact-detail` | lazy |
| `/settings` | `pages/settings` → `widgets/settings-screen` | lazy |
| `/bills/new` | `pages/create-bill` → `features/create-bill` (`BillForm`) | lazy |
| `/bills/:billId` | `pages/bill-detail` → `widgets/bill-detail` | lazy |
| `/bills/:billId/edit` | `pages/edit-bill` → `features/create-bill` (`BillForm` с `bill`, `locked` при погашениях) | lazy |
| `*` | редирект на `/` | — |

Откуда открыта карточка контакта, передаётся через `location.state.from` (`"home" | "contacts"`, проп `linkState` у `ContactRow`); от него зависят активный раздел бокового меню (`useSideNavSection`) и цель кнопки «назад». Экран счёта получает `BillLinkState` (`{ from: "home" }` или `{ from: "contact", contactId }`) — «назад» ведёт на главную или в карточку контакта; форма счёта — `{ backTo }` для «Отмены». После создания счёта — `navigate(/bills/:id, { replace: true })`, чтобы «назад» не возвращал в форму.

## Каркас и режимы

`AppShell` выбирает режим по пути (`useShellMode`, через `matchPath`):

- `section` — `/`, `/contacts`, `/settings`: на мобильном плавающее нижнее меню `BottomNav` и круглая кнопка «+» (`CreateFab` — меню Radix `DropdownMenu` «Новый долг» → `/new` / «Разделить счёт» → `/bills/new`; открытое меню поворачивает «+» в «×» «Закрыть меню»);
- `fullscreen` — `/new`, `/contacts/:id` и `/bills/*` на мобильном: без нижнего меню, со своей шапкой. В боковом меню `/bills/*` подсвечивает «Главную».

От 1024 px всегда показывается боковое меню `SideNav` и «+» в правом нижнем углу. Раскладка «список + карточка» на `/contacts` — CSS-сетка в `ContactsPage`: на мобильном видна только одна колонка (`max-lg:hidden`), на десктопе обе. Баннер ошибки хранилища каркас подставляет под заголовок любого экрана через контекст `PageHeaderAfterSlot`.

Формы нового долга и счёта держат кнопку над клавиатурой: `interactive-widget=resizes-content` в `index.html` (Chrome/Android сжимает layout) и отступ по `visualViewport` из `useKeyboardInset` (iOS Safari).

## Модальные окна

- `Dialog` и `AlertDialog` на ширине меньше 1024 px — шторка снизу, шире — диалог по центру (только CSS, общие классы в `components/ui/dialog.tsx`).
- Утилитарная модалка подтверждения — `shared/ui/modals/ConfirmActionModal` (`AlertDialog`, необязательная строка `lead` над описанием): удаление долга и счёта, сброс данных.
- Шторка «Кто заплатил» (`features/create-bill/ui/PayerSheet`) — управляемый `Dialog` внутри формы. Модалки рендерятся вне роутера, поэтому «Открыть счёт» в «Изменить долг» передаётся колбэком `onOpenBill`. Подтверждение импорта со сводкой — `features/import-backup/ui/ImportBackupConfirm`.
- Модалки с доменной логикой — в фичах: `features/edit-debt/ui/EditDebtDialog.tsx`, `features/add-repayment/ui/AddRepaymentDialog.tsx` (`NiceModal.create` + shadcn `Dialog`). Открываются хелперами `showEditDebtDialog` / `showAddRepaymentDialog`.
- Создание долга — не модалка, а страница `/new`.
- `components/ui/dialog.tsx`: `DialogContent` игнорирует «клик наружу», если координаты события внутри рамки диалога — обход бага Radix с вложенными слоями (`Select`/`Popover`), которые временно отключают `pointer-events` у диалога.

## State management: Zustand

`src/entities/debt/model/debt-store.ts` (`useDebtStore`) — один стор на домен (контакты + долги + операции + счета + курс), чтобы `features` не импортировали `app`, а счёт и его долги менялись атомарно.

**Состояние:** `contactsById`, `debtsById`, `operationsByDebtId` (по `createdAt`), `billsById`, `ratesCache`, `ratesFetchError` (мягкая ошибка курса, не путать с `lastError`), `hydrated`, `lastError`.

**Actions:** `hydrate()`, `getOrCreateContact(name)`, `createDebt(input)`, `updateDebt(id, patch)`, `addRepayment(debtId, amount, note?)`, `deleteDebt(id)`, `createBill(input)`, `updateBill(id, input)`, `deleteBill(id)`, `setBillManualClosed(id, closed)`, `refreshRatesIfStale(force?)`, `clearError()`.

- Все записи — оптимистично: сначала память, затем IndexedDB, при ошибке — откат и `lastError`.
- `updateDebt`: направление/сумма/валюта меняются, только пока нет операций `repayment`; при смене суммы обновляется и операция `initial`.
- Счёт (`model/bill/`): доли, балансы и переводы — чистые функции в целых копейках (`computeBillShares`, `computeBillTransfers` поверх `shared/lib/settlement` → `minimizeTransfers`, `computeMyBillDebts`, `computeBillStatus`, `validateBill`, `spreadBillRemainder`). Статус и переводы не хранятся — выводятся из `participants` и связанных долгов.
- `createBill` / `updateBill` пишут счёт и долги одной транзакцией (`putBillWithDebts`) и при ошибке откатывают только затронутые записи. `updateBill` до погашений пересчитывает долги, сопоставляя их по (`contactId`, `direction`): совпавшие сохраняют `id` и дату; после погашений меняет только описание (и заметки долгов), иначе отказ. `deleteBill` — `deleteBillCascade`. `setBillManualClosed` — только для счёта без долгов пользователя.
- Агрегаты не хранятся в сторе — это чистые функции в `entities/debt/model/`.

## Персистентность

- **IndexedDB** (`src/shared/lib/storage/`, БД `debts`, версия 2): сторы `contacts`, `debts` (индексы `by-contactId`, `by-billId`), `debtOperations` (индекс `by-debtId`), `bills`, `meta` (одна запись: `schemaVersion` + `ratesCache`). Доступ — через интерфейс `StorageAdapter` (`contract.ts`), реализация `indexed-db-adapter.ts`. Одной транзакцией: `deleteDebt` (долг + операции), `putBillWithDebts` (счёт + добавленные, изменённые и удалённые долги с операциями), `deleteBillCascade` (счёт + долги по `by-billId` + их операции), `replaceAll`; синхронная ошибка внутри транзакции её отменяет (`commitOrAbort`).
- **Миграции:** `upgrade` по `oldVersion`. `< 1` — исходные сторы; `< 2` — стор `bills` и индекс `debts.by-billId`. Старые долги не переписываются: отсутствующий `billId` нормализуется в `null` при `hydrate` и экспорте. `meta.schemaVersion = 2` пишется при любой записи `meta`. Откат на версию без счетов на том же профиле невозможен (VersionError) — только через резервную копию.
- **localStorage** (не дублирует доменные данные): тема, валюта итогов (меняется и в настройках, и нажатием на итог на главной; подписчики `useDisplayCurrency` узнают о смене через событие `app-display-currency-change`); ключи — `shared/lib/client-storage-keys.ts`, сброс — `clear-client-storage.ts`.
- **sessionStorage**: флаг однократной автоперезагрузки при ошибке загрузки чанка (`RouteErrorBoundary`).
- **Backup/restore:** UI — `features/export-backup` (`useExportBackup`) и `features/import-backup` (`useImportBackup`: выбор файла → `parseDebtsBackup` → подтверждение), используются в настройках и на пустой главной; логика — `storage/backup.ts` — `createDebtsBackup` / `parseDebtsBackup` / `restoreDebtsFromBackup`; формат `{ version: 2, exportedAt, meta, contacts, debts, debtOperations, bills }`; `parseDebtsBackup` принимает и `version: 1` (без `bills`: счетов нет, `billId = null`) и обнуляет `billId`, указывающий на отсутствующий счёт; восстановление = `replaceAll` одной транзакцией + перезагрузка страницы.

## Курс валют

`src/shared/lib/exchange-rate/`: `fetchExchangeRates()` (база USD, источник `@fawazahmed0/currency-api` на jsDelivr, зеркало на `currency-api.pages.dev`), `convertAmount()`, `isRatesCacheStale()`. Кэш — `meta.ratesCache`.

Строка статуса в настройках — `features/refresh-exchange-rates` (`ExchangeRateStatusRow`): «Обновлён <`fetchedAt`>», «Нет сети · курс от <дата курса>» (по `useOnlineStatus`), «Не удалось обновить» + «Повторить» (по `ratesFetchError`).

```
hydrate() → refreshRatesIfStale() (fire-and-forget)
    → fetchExchangeRates() → store.ratesCache → meta.ratesCache (IndexedDB)
```

## Data flow

```
UI (pages/widgets)
    → feature (create-debt / add-repayment / …) вызывает action useDebtStore
        → Zustand обновляет память (оптимистично)
            → StorageAdapter → IndexedDB
```

## PWA

`vite-plugin-pwa`: precache сборки, манифест `site.webmanifest`, обновление по запросу пользователя (`features/pwa-app-update` показывает toast «Доступна новая версия»). Для GitHub Pages база задаётся `VITE_BASE_PATH`.

## Нефункциональные требования

- **Производительность:** мгновенный отклик за счёт оптимистичных обновлений; загрузка курса не блокирует первый рендер; тяжёлые экраны грузятся лениво.
- **Offline-first:** всё, кроме обновления курса, работает без сети.
- **Надёжность:** доменные данные только в IndexedDB; ошибки записи откатываются; ошибка курса не выглядит как сбой хранилища.
- **Приватность:** данные не покидают устройство; запрос курса не содержит персональных данных.
- **Точность денег:** суммы округляются до 2 знаков (`roundAmount`) на каждой операции; отображение — `formatMoney` / `formatMoneyBreakdown` (`shared/lib/format-amount`).
- **Даты:** `shared/lib/format-date` — «12 сен», «15 октября», «15 октября в 12:40», «12 октября 2026, 18:05».
- **Расширяемость под backend:** `StorageAdapter` — единая точка обмена данными; UUID совместимы с серверными. Выбор адаптера — в `app` (сейчас всегда IndexedDB).

## Качество и CI

- `npm run check` (Biome), `npm run knip`, `npm run spec:validate` (OpenSpec), `npm run tokens:contrast` (контраст пар токенов, `scripts/check-contrast.mjs`), `npm run build` (`tsc -b` + Vite) — в `.github/workflows/ci.yml` на каждый push.
- Автотестов пока нет. Кандидаты на unit-тесты без React: `computeDebtBalance`, `computeContactSummary`, `computeGlobalTotals`, `convertAmount`, `parseDebtsBackup`, маска `AmountInput`; стор — с моком `StorageAdapter`.
- Релизы: `scripts/release.sh` + `.github/workflows/release.yml` (тег → GitHub Release → GitHub Pages), см. README.
