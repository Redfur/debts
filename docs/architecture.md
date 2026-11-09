# Архитектура

Справочник по устройству кода. Поведение продукта (что система должна делать) описано в [`openspec/specs/`](../openspec/specs); здесь — как это реализовано. Термины и модель данных — в [domain.md](./domain.md), правила кода — в [coding-standards.md](./coding-standards.md), токены и компоненты интерфейса — в [design-system.md](./design-system.md).

## Стек

React 19, Vite 8, TypeScript, Zustand, react-router-dom, react-i18next, Tailwind CSS 4 (токены дизайн-системы в `src/index.css`, шрифт Onest), shadcn/ui (Radix), Base UI Drawer, `@ebay/nice-modal-react`, IndexedDB через `idb`, PWA (`vite-plugin-pwa`), date-fns, Sonner (toasts). Бэкенда нет.

## Feature-Sliced Design (привязка к репозиторию)

| Слой | Папка | Роль |
|------|--------|------|
| App | `src/app/` | Провайдеры (i18n, NiceModal, Tooltip, гидрация стора, Toaster), роутинг (`AppRoutes`, lazy-страницы + `route-fallbacks` со скелетонами), каркас `app/layout` (`AppShell`, `BottomNav`, `CreateFab`, `SideNav`, `StorageErrorBanner`, `useShellMode` / `useSideNavSection`), `RouteErrorBoundary` |
| Pages | `src/pages/` | `home` (`/`), `create-debt` (`/new`), `create-bill` (`/bills/new`), `bill-detail` (`/bills/:billId`), `edit-bill` (`/bills/:billId/edit`), `contacts` (`/contacts`, раскладка «список + карточка» с `Outlet`), `contact-detail` (`/contacts/:contactId`), `settings` (`/settings`) |
| Widgets | `src/widgets/` | `home-screen` (в т.ч. секция «Счета», карточка и плашка установки), `contacts-screen`, `contact-detail`, `bill-detail`, `settings-screen` |
| Features | `src/features/` | `select-contact` (`ContactPicker`, мультивыбор `ParticipantsPicker`), `create-debt`, `create-bill` (`BillForm`: создание, изменение, изменение после погашений; переключатель «Одной суммой / По чеку» — `BillFormState.entry`, в режиме чека один экран: `BillBasicsSection` с суммой по чеку и разбивкой, `BillItemsSection`, `BillAdjustmentsSection` (скидка и чаевые), `BillReceiptShares` и строка состояния над кнопкой; отметки «кто делит» постоянной ширины — `BillPeopleChips`; доли считаются по черновику без незаполненных позиций и ошибочных скидки и чаевых, проверка — по полному; `PayerSheet`, общие подписи и сводка — `BillOutcome`), `delete-bill` (`showDeleteBillConfirm`), `toggle-bill-closed`, `edit-debt`, `add-repayment`, `set-display-currency`, `refresh-exchange-rates`, `export-backup`, `import-backup`, `install-app` (приглашения к установке, шторка «Как установить», группа «Приложение» в настройках, постоянное хранилище), `pwa-app-update` |
| Entities | `src/entities/` | `debt`: типы, Zustand-стор `useDebtStore`, хук `useDebtOperations`, агрегаты `computeDebtBalance` / `computeContactSummary` / `computeContactTotals` / `computeGlobalTotals` / `computeNetPosition` / `countContactsByDirection`, UI `ContactAvatar`, `ContactRow`, `AmountPill`, `DirectionChip`, `DirectionToggle`, `DebtStatusBadge`, `NetPositionLine`; счёт — `model/bill/` (расчёт, `useBillDebts`), UI `BillRow`, `BillMyPart`, `BillStatusBadge`, `TransferList`, `BillLink`, `ParticipantAvatar` |
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
| `/settings/changelog` | `pages/changelog` → `widgets/changelog-screen` | lazy |
| `/bills/new` | `pages/create-bill` → `features/create-bill` (`BillForm`) | lazy |
| `/bills/:billId` | `pages/bill-detail` → `widgets/bill-detail` | lazy |
| `/bills/:billId/edit` | `pages/edit-bill` → `features/create-bill` (`BillForm` с `bill`, `locked` при погашениях; счёт по чеку открывается в режиме «По чеку») | lazy |
| `*` | редирект на `/` | — |

Откуда открыта карточка контакта, передаётся через `location.state.from` (`"home" | "contacts"`, проп `linkState` у `ContactRow`); от него зависят активный раздел бокового меню (`useSideNavSection`) и цель кнопки «назад». Экран счёта получает `BillLinkState` (`{ from: "home" }` или `{ from: "contact", contactId }`) — «назад» ведёт на главную или в карточку контакта; форма счёта — `{ backTo }` для выхода («Назад» при создании, «Отмена» при редактировании). После создания счёта — `navigate(/bills/:id, { replace: true })`, чтобы «назад» не возвращал в форму.

## Каркас и режимы

`AppShell` выбирает режим по пути (`useShellMode`, через `matchPath`):

- `section` — `/`, `/contacts`, `/settings`: на мобильном плавающее нижнее меню `BottomNav` и круглая кнопка «+» (`CreateFab` — меню Radix `DropdownMenu` «Новый долг» → `/new` / «Разделить счёт» → `/bills/new`; открытое меню поворачивает «+» в «×» «Закрыть меню»);
- `fullscreen` — `/new`, `/contacts/:id`, `/settings/changelog` и `/bills/*` на мобильном: без нижнего меню, со своей шапкой. В боковом меню `/bills/*` подсвечивает «Главную», `/settings/changelog` — «Настройки». Кнопка «Назад» в истории всегда ведёт в `/settings`, в том числе после прямого входа.

От 1024 px всегда показывается боковое меню `SideNav` и «+» в правом нижнем углу. Раскладка «список + карточка» на `/contacts` — CSS-сетка в `ContactsPage`: на мобильном видна только одна колонка (`max-lg:hidden`), на десктопе обе. Баннер ошибки хранилища каркас подставляет под заголовок любого экрана через контекст `PageHeaderAfterSlot`.

Формы нового долга и счёта держат кнопку над клавиатурой: `interactive-widget=resizes-content` в `index.html` (Chrome/Android сжимает layout) и отступ по `visualViewport` из `useKeyboardInset` (iOS Safari).

## Модальные окна

- `components/ui/adaptive-modal.tsx` выбирает один backend для `Dialog` / `AlertDialog`: при открытии на ширине < 1024 px — Base UI Drawer (`drawer.tsx`, `@base-ui/react`), от 1024 px — Radix Dialog/AlertDialog. Режим фиксируется до завершения закрытия, поэтому изменение ширины не размонтирует введённую форму; следующее открытие учитывает новую ширину. Контекст передаёт режим, `dismissible`, возврат фокуса и завершение закрытия всем частям окна.
- Мобильный Drawer владеет жестом, анимацией, focus trap и scroll-lock. Локальный адаптер на старте жеста помечает `data-base-ui-swipe-ignore` интерактивные элементы, выделенный текст и область с ненулевым scrollTop: достижение верха в середине движения не превращает прокрутку в свайп. Ручка находится вне scroll-области и работает независимо от списка. Физика жеста остаётся библиотечной.
- `Drawer.VirtualKeyboardProvider` — единственный владелец клавиатурной геометрии мобильного окна; `--drawer-keyboard-inset` ограничивает высоту и поднимает шторку над перекрывающей клавиатурой. Прежний `useKeyboardInset` используется только полноэкранными формами. Для iOS overlay у body задан `position: relative`; анимации учитывают reduced-motion.
- Утилитарная модалка подтверждения — `shared/ui/modals/ConfirmActionModal` (`AlertDialog`, необязательная строка `lead` над описанием): удаление долга и счёта, сброс данных.
- Шторка «Кто заплатил» (`features/create-bill/ui/PayerSheet`) — управляемый `Dialog` внутри формы. Модалки рендерятся вне роутера, поэтому «Открыть счёт» в «Изменить долг» передаётся колбэком `onOpenBill`. Подтверждение импорта со сводкой — `features/import-backup/ui/ImportBackupConfirm`.
- Модалки с доменной логикой — в фичах: `features/edit-debt/ui/EditDebtDialog.tsx`, `features/add-repayment/ui/AddRepaymentDialog.tsx` (`NiceModal.create` + shadcn `Dialog`). Открываются хелперами `showEditDebtDialog` / `showAddRepaymentDialog`.
- Создание долга — не модалка, а страница `/new`.
- На десктопе `components/ui/dialog.tsx`: `DialogContent` игнорирует «клик наружу», если координаты события внутри рамки диалога — обход бага Radix с вложенными слоями (`Select`/`Popover`), которые временно отключают `pointer-events` у диалога.


- Вложенный CurrencyPicker остаётся React-потомком родительского Root; Base UI управляет вложенностью и независимыми корнями NiceModal. Radix Select/Popover сохраняют свои порталы и focus scope: адаптивный Root отменяет повторную обработку Escape, уже предотвращённого Radix. Мобильный AlertDialogAction переводит контракт `preventDefault()` в `preventBaseUIHandler()`, чтобы подтверждение не закрывалось до завершения async-действия.
- Обычные окна закрываются по фону, отменой, Escape и мобильным свайпом. Подтверждения запрещают закрытие по фону. Во время `busy` / `pending` общий `dismissible=false` отменяет запросы закрытия; swipe-ignore не даёт начать drag, кнопки отмены и повторного выполнения отключаются. Синхронные ref-защиты исключают запуск повторного действия до перерисовки React. Программное закрытие после записи доступно.
- `shared/lib/use-modal-close.ts` связывает NiceModal с `onCloseComplete`: `hide()` запускает закрытие, затем по фактическому окончанию вызываются `resolveHide()` и `remove()` один раз. Base UI сообщает `onOpenChangeComplete(false)`; Radix ожидает завершение CSS-анимаций через Web Animations (при отсутствии анимации — следующий кадр). Фиксированного таймера нет. Переход «Открыть счёт» ждёт завершения hide. Публичные результаты helper-ов сохранены.
- При открытии сохраняется цепочка предков инициатора. После закрытия фокус возвращается к нему, а при его удалении — к ближайшему доступному действию в сохранившемся предке. Закрытие дочернего окна не удаляет родителя и его поля.
- Воспроизводимый стенд всех семи потребителей и вложенных Radix-порталов — `scripts/drawer-fixture.html` / `.tsx`; CDP-сценарии — `scripts/check-drawers.mjs`, `drawer-scenarios.mjs`. Стенд доступен только по явному URL dev-сервера, не импортируется приложением и не входит в production-сборку. Команды и ограничения проверки — в `openspec/changes/archive/2026-11-09-mobile-drawer-interactions/verification.md`.

## State management: Zustand

`src/entities/debt/model/debt-store.ts` (`useDebtStore`) — один стор на домен (контакты + долги + операции + счета + курс), чтобы `features` не импортировали `app`, а счёт и его долги менялись атомарно.

**Состояние:** `contactsById`, `debtsById`, `operationsByDebtId` (по `createdAt`), `billsById`, `ratesCache`, `ratesFetchError` (мягкая ошибка курса, не путать с `lastError`), `hydrated`, `lastError`.

**Actions:** `hydrate()`, `getOrCreateContact(name)`, `createDebt(input)`, `updateDebt(id, patch)`, `addRepayment(debtId, amount, note?)`, `deleteDebt(id)`, `createBill(input)`, `updateBill(id, input)`, `deleteBill(id)`, `setBillManualClosed(id, closed)`, `refreshRatesIfStale(force?)`, `clearError()`.

- Все записи — оптимистично: сначала память, затем IndexedDB, при ошибке — откат и `lastError`.
- `updateDebt`: направление/сумма/валюта меняются, только пока нет операций `repayment`; при смене суммы обновляется и операция `initial`.
- Счёт (`model/bill/`): доли, балансы и переводы — чистые функции в целых копейках (`computeBillShares`, `computeBillTransfers` поверх `shared/lib/settlement` → `minimizeTransfers`, `computeMyBillDebts`, `computeBillStatus`, `validateBill`, `spreadBillRemainder`). Статус и переводы не хранятся — выводятся из `participants` и связанных долгов. «По чеку» (`splitMode: "items"`): деньги — `computeReceiptCents` (позиции − скидка + чаевые; скидка и чаевые с ошибкой — `discountIssue` / `tipsIssue` — не применяются), доли — точные дроби на `BigInt` по позициям и чаевым (общий знаменатель — НОК «на скольких» × сумма позиций) с одним округлением на весь чек (неделимые копейки — по наибольшему остатку), доля людей без имени (`BillShares.othersCents`) при расчёте балансов вычитается у плательщика, поэтому виртуального участника в переводах нет.
- `createBill` / `updateBill` пишут счёт и долги одной транзакцией (`putBillWithDebts`) и при ошибке откатывают только затронутые записи. `updateBill` до погашений пересчитывает долги, сопоставляя их по (`contactId`, `direction`): совпавшие сохраняют `id` и дату; после погашений меняет только описание (и заметки долгов), иначе отказ. `BillInput.items`, `discount` и `tips` нормализует `prepareBillDraft`: для «По чеку» итог — позиции − скидка + чаевые, `inSplit` — по отметкам в позициях и чаевых, отметки — в порядке участников, процент — до двух знаков; позиция или чаевые с чужим `ref`, повтором или людьми без имени вне 0…99 — отказ; после погашений сравниваются и позиции, скидка и чаевые. `deleteBill` — `deleteBillCascade`. `setBillManualClosed` — только для счёта без долгов пользователя.
- Агрегаты не хранятся в сторе — это чистые функции в `entities/debt/model/`.

## Персистентность

- **IndexedDB** (`src/shared/lib/storage/`, БД `debts`, версия 3): сторы `contacts`, `debts` (индексы `by-contactId`, `by-billId`), `debtOperations` (индекс `by-debtId`), `bills`, `creationDrafts` (ключ `kind`), `meta` (одна запись: `schemaVersion` + `ratesCache`). Доступ — через интерфейс `StorageAdapter` (`contract.ts`), реализация `indexed-db-adapter.ts`. Одной транзакцией: `deleteDebt` (долг + операции), `putBillWithDebts` (счёт + добавленные, изменённые и удалённые долги с операциями), `deleteBillCascade` (счёт + долги по `by-billId` + их операции), `replaceAll`; синхронная ошибка внутри транзакции её отменяет (`commitOrAbort`).
- **Миграции:** `upgrade` по `oldVersion`. `< 1` — исходные сторы; `< 2` — стор `bills` и индекс `debts.by-billId`; `< 3` — store `creationDrafts` по ключу `kind`. Старые долги и счета не переписываются: отсутствующий `billId` нормализуется в `null`, отсутствующие `Bill.items` — в `[]`, `discount` и `tips` — в `null` при `hydrate` и экспорте (`normalizeBill`) (деление по чеку не потребовало новой версии БД). `meta.schemaVersion = 3` пишется при любой записи `meta`. Откат на версию без счетов на том же профиле невозможен (VersionError) — только через резервную копию.
- **localStorage** (не дублирует доменные данные): тема, текущая валюта `debts.displayCurrency` и предпочитаемая `debts.preferredDisplayCurrency`. `currency-preference-state.ts` хранит согласованный снимок и подписки; `currency-preference.ts` подключает React через `useSyncExternalStore`. Текущая меняется в настройках и нажатием на главной; предпочитаемая — отдельно в настройках с одновременной сменой текущей; ключи — `shared/lib/client-storage-keys.ts`, сброс — `clear-client-storage.ts`. Служебные отметки (`CLIENT_STATE_KEYS`: закрытая плашка установки) «Сбросить настройки интерфейса» не трогает, «Очистить всё» удаляет (`clearAllClientStorage`).
- **sessionStorage**: флаг однократной автоперезагрузки при ошибке загрузки чанка (`RouteErrorBoundary`).
- **Backup/restore:** UI — `features/export-backup` (`useExportBackup`) и `features/import-backup` (`useImportBackup`: выбор файла → `parseDebtsBackup` → подтверждение), используются в настройках и на пустой главной; логика — `storage/backup.ts` — `createDebtsBackup` / `parseDebtsBackup` / `restoreDebtsFromBackup`; формат `{ version: 3, exportedAt, meta, contacts, debts, debtOperations, bills }` (у счёта — `items`, `discount`, `tips`); `parseDebtsBackup` принимает и `version: 1` (без `bills`: счетов нет, `billId = null`), и `version: 2` (счета без позиций, `items = []`), отклоняет копию 3 со счётом `items` без массива позиций и обнуляет `billId`, указывающий на отсутствующий счёт; восстановление = `replaceAll` одной транзакцией + перезагрузка страницы.

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

**Манифест** (`vite.config.ts`):
- `id: base` — равен `start_url`, который браузеры брали за идентификатор до появления явного `id`; менять нельзя, иначе установленные копии задвоятся;
- иконки: `pwa-192x192.png` / `pwa-512x512.png` (`any`, знак с прозрачными углами) и `web-app-manifest-*.png` (`maskable`);
- `shortcuts` «Новый долг» (`new`) и «Разделить счёт» (`bills/new`) с иконками `shortcut-*.png`;
- `description` и `screenshots` (`public/screenshots/`: три `narrow` 1080×2340 с подписью и `wide` 1440×900) — для подробного диалога установки на Android. Скриншоты исключены из precache (`globIgnores`) и снимаются с собранного приложения на демо-данных; переснимать при заметных изменениях главной, карточки контакта или экрана счёта.

**Установка** (`features/install-app`):
- `initInstallApp()` вызывается в `src/main.tsx` до рендера: перехватывает `beforeinstallprompt` (откладывает системный диалог для кнопки «Установить») и `appinstalled` (тост), а в установленном режиме молча просит `navigator.storage.persist()`.
- Режим — «установлено» (`display-mode` / `navigator.standalone`), «внутри другого приложения» (UA встроенных браузеров) или «в браузере»; платформа — iOS/iPadOS или другая (`lib/detect-platform.ts`, чистые функции). Состояние — модульный стор + `useSyncExternalStore` (`useInstallState`).
- UI: `InstallOnboardingCard` (пустая главная), `InstallBanner` (над итогами, закрывается навсегда), шторка «Как установить» (шаги по платформе; на iOS и во встроенном браузере при наличии записей — перенос через резервную копию), `InstallSettingsRows` (группа «Приложение»: режим и защита данных от автоочистки). Экспорт копии — другая фича, поэтому виджеты передают `onSaveBackup` из `useExportBackup`.

## История изменений

`CHANGELOG.md` — единый источник описаний для приложения и будущих GitHub Releases. История доступна по ссылке внизу настроек. Новый слайс `pages/changelog` подключает `widgets/changelog-screen`: одноколоночную ленту версий с датами, абзацами, группами и списками. Переводы заголовков и пустого состояния находятся в слайсе виджета.

`build/changelog.ts` разбирает используемое подмножество Keep a Changelog: версии, календарные даты, абзацы, группы, списки, жирное выделение и inline-код. Исключаются вступление, `[Unreleased]`, пустые группы и версии новее `VITE_APP_VERSION` (с необязательным `v`); версии сравниваются численно. Неподдержанный блок, неизвестная группа, повтор версии и неверная дата дают явную ошибку с номером строки. Проверки: `node --experimental-strip-types --test build/changelog.test.ts` (Node 22+).

Локальный плагин `build/changelog-plugin.ts` в `vite.config.ts` предоставляет типизированный `virtual:changelog`, обновляемый при изменении исходного файла в dev. Данные входят только в ленивый чанк истории и существующий precache PWA: экран впервые открывается без сети после кеширования приложения, без запросов за Markdown, JSON или GitHub Releases. Генерируемые исходники не записываются. Дата отображается в UTC как календарная дата без сдвига дня; текст выводится React-элементами без исполнения HTML. Новых зависимостей, состояния в сторе, записей в хранилище и изменений формата бэкапа нет.

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
- Целевые проверки валют и предпочтений: `node --experimental-strip-types --test build/currencies.test.ts build/currency-preference.test.ts` (Node 22+). Остальные кандидаты на unit-тесты без React: `computeDebtBalance`, `computeContactSummary`, `computeGlobalTotals`, `convertAmount`, `parseDebtsBackup`, маска `AmountInput`; стор — с моком `StorageAdapter`.
- Релизы: `scripts/release.sh` + `.github/workflows/release.yml` (тег → GitHub Release → проверка и сборка → GitHub Pages и контейнер в GHCR), см. README. Задача `container` берёт checkout релизного тега, проверяет версию `package.json` и публикует `ghcr.io/redfur/debts:vX.Y.Z` и `ghcr.io/redfur/debts:latest`; `latest` обновляется при каждой успешной публикации.
- Контейнер: корневой `Dockerfile` собирает статическую PWA с `VITE_BASE_PATH=/`; runtime nginx использует `nginx.conf` со SPA fallback и правилами кеширования. `compose.yaml` скачивает явно выбранную версию из GHCR и публикует HTTP только на loopback. Серверная БД и тома с пользовательскими данными не нужны.

## Сохранение форм создания

Типы `CreationDraft` и исходных полей объявлены в `shared/lib/storage/schema.ts` без зависимостей от features. Миграция IndexedDB 2 → 3 добавляет пустой store `creationDrafts`, не переписывая прежние записи; метаданные отражают версию 3. Версия файла резервной копии остаётся 3. Понижение версии БД на месте не поддерживается: для отката окончательные записи экспортируются и восстанавливаются в совместимой версии на чистом профиле; черновики через файл не переносятся.

`entities/debt/model/creation-drafts` владеет отдельным Zustand-состоянием двух форм и последовательными очередями записи по виду. Гидрация запускается провайдером после чтения доменных данных; её результат отслеживается отдельно для каждого вида. Повторный mount/Strict Mode не переинициализирует черновики. `CreationDraftGate` не монтирует форму до чтения; неизвестная версия или повреждённый формат показывают ошибку с повтором, явным удалением и выходом.

`CreateDebtForm` и `useBillForm` передают полный снимок из обработчика изменения, без debounce и зависимости от размонтирования. Модель хранит актуальный снимок в памяти, состояние записи и блокировку завершения; «Черновик сохранён» появляется только после commit последнего снимка. Ошибки автосохранения отображаются рядом с формой, повтор пишет актуальный ввод. Кнопка «Назад» ждёт очередь; при ошибке предлагает «Остаться» / «Выйти». Браузерная навигация не отменяет очередь. После принудительной выгрузки гарантируется восстановление завершённых транзакций.

`completeCreationDraft` останавливает новые записи, ждёт очередь и вызывает создание с id сеанса. `putDebtWithOperation` атомарно пишет долг и начальную операцию и удаляет соответствующий черновик. `putBillWithDebts` получает id только при создании; редактирование черновик не затрагивает. При abort окончательные оптимистичные записи откатываются, ввод и возможность автосохранения остаются. `features/delete-creation-draft` подтверждает удаление с формы и главной; удаление сериализовано с записями и проверяет id сеанса.

`widgets/home-screen/CreationDraftsSection` располагается перед содержимым в обеих ветках главной, сохраняя онбординг установки. Страницы создания передают текущую цель возврата и действие удаления через props; features не импортируют друг друга для управления черновиком.

`replaceAll` очищает черновики в одной транзакции замены данных через `commitOrAbort`. Импорт и сброс данных вызываются через `clearCreationDraftsWith`, который блокирует новые снимки и ждёт очереди, чтобы отложенная запись не восстановила очищенный черновик. При ошибке очистки состояние в памяти сохраняется. Экспорт перечисляет только окончательные записи; сброс UI-настроек к черновикам не обращается. Несколько вкладок используют последнее записанное состояние, согласование конфликтующих версий не входит в этот сценарий.

## Каталог и выбор валют

`shared/config/currency-catalog.ts` — единый офлайн-источник 155 кодов, русских названий, коротких подписей и обозначений. Тип `CurrencyCode` выводится из ключей и реэкспортируется storage; обратного импорта storage в каталог нет. Источники и дата сверки API с текущим ISO 4217 указаны рядом с данными. Каталог входит в обычную сборку и precache; сетевые обращения за метаданными в приложении не нужны.

`shared/config/currencies.ts` строит справочники, выполняет поиск и сортировку. Валюта фактической локали задаётся явно (`ru`/`ru-RU` → RUB, fallback — RUB); при добавлении языка нужно добавить соответствие. Верхний набор и круг формируются одним правилом порядка: локаль, предпочитаемая, USD, использованные коды по алфавиту, с удалением повторов.

`entities/debt/model/debt-currencies.ts` выделяет все использованные валюты и активные с положительным остатком через `computeDebtBalance`; `useDebtCurrencies` соединяет их с preferences. Features передают верхний набор в `AmountField`/`CurrencyPicker` параметрами, `HomeScreen` передаёт единый круг обеим карточкам итогов. Shared не импортирует entities.

Кэш курса — частичная карта: загрузчик отбирает конечные положительные значения каталога из прежнего USD-запроса, нормализует USD к 1. Старые кэши из четырёх валют допустимы; новые курсы появятся при обычном или ручном обновлении. Отсутствующий или неположительный курс с любой стороны означает недоступную конвертацию. Структура IndexedDB, бэкап версии 3 и черновики версии 1 не меняются; валидатор черновиков использует общий каталог.

Миграция предпочтений выполняется до первого изменения текущей валюты: новое валидное предпочтение имеет приоритет, иначе копируется прежняя текущая, иначе валюта локали. Повторный запуск не перезаписывает предпочтение. Недоступная запись localStorage оставляет настройки в памяти сеанса. `clearClientStoragePreferences` удаляет оба ключа и уведомляет обе подписки; финансовые данные и черновики не затрагиваются. Старое приложение может не распознать новые коды — обратная совместимость новых валют со старым кодом не гарантируется.
