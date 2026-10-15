# Design

## Context

Мотивация и состав — в `proposal.md`, поведение — в `specs/`. Ниже только то, что определяет реализацию.

- Все доменные данные — в одном Zustand-сторе `useDebtStore` (`src/entities/debt/model/debt-store.ts`): контакты, долги, операции, курс. Записи оптимистичные: сначала память, потом `StorageAdapter`, при ошибке откат и `lastError`.
- IndexedDB `debts` версии 1 (`src/shared/lib/storage/indexed-db-adapter.ts`), `meta.schemaVersion = 1`, миграций ещё не было. `StorageAdapter` (`contract.ts`) пишет по одной записи, атомарен только `replaceAll` и каскадный `deleteDebt`.
- Резервная копия `version: 1` (`backup.ts`), восстановление — `wipeAppIndexedDatabase()` + запись всего.
- FSD: `app → pages → widgets → features → entities → shared`, импорт только через `index.ts` слайса.
- Макеты счёта — концепт; экраны строятся по `design-brief.md` этого change после макетов.

## Goals / Non-Goals

**Goals:**
- Счёт и его долги пишутся и удаляются атомарно, без полу-созданных состояний.
- Расчёт счёта (доли, балансы, переводы) — чистые функции в целых копейках, детерминированные и тестируемые без React.
- Существующие агрегаты (итоги, сводки, чистая позиция) не меняются: долги из счёта — обычные `Debt`.

**Non-Goals:**
- Хранить переводы между третьими лицами как сущности: они вычисляются.
- Отдельный стор для счетов.
- Автотесты как инфраструктура (в проекте их нет); проверки расчёта — в задачах.

## Decisions

### 1. Модель данных

```
Contact (1) --< (N) Debt (1) --< (N) DebtOperation
                     |
                     | billId (nullable)
                     v
                   Bill  (participants[].contactId -> Contact)
```

`PersistedBill` (новый стор `bills`, `keyPath: id`):

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | UUID (`generateId`) |
| `title` | string \| null | «За что» |
| `currency` | CurrencyCode | Валюта счёта и его долгов |
| `totalAmount` | number | Сумма, 2 знака |
| `splitMode` | `"equal" \| "shares" \| "amounts"` | Способ деления |
| `participants` | `BillParticipant[]` | Порядок важен: он задаёт раздачу копеек и тай-брейк переводов |
| `manualClosedAt` | string \| null | Ручное закрытие (только для счёта без моих переводов) |
| `createdAt` / `updatedAt` | string | ISO |

`BillParticipant`: `{ ref: "me" | string /* contactId */, paid: number, inSplit: boolean, shareInput: number | null }`. `shareInput` — доля (для `shares`) или сумма (для `amounts`), для `equal` — `null`.

`PersistedDebt.billId: string | null` + индекс `by-billId`.

**Почему не храним статус счёта:** статус выводится. Если есть мои переводы — из статусов связанных долгов; если нет — из `manualClosedAt`. Так не нужно синхронизировать статус при каждом погашении, а `addRepayment` и `deleteDebt` не трогают счёт. Альтернатива — поле `status` и пересчёт в `addRepayment` — даёт два источника правды.

**Почему не храним переводы:** они выводятся из `participants` и всегда совпадают с алгоритмом. Связь «перевод → долг» восстанавливается по паре (`contactId`, направление): в минимальной схеме у «Я» не больше одного перевода с каждым контактом.

### 2. Расчёт

- `src/shared/lib/settlement/` — доменно-нейтральный модуль: `minimizeTransfers(balances: { id: string; cents: number }[]): { from, to, cents }[]`.
  - n ≤ 12 (ненулевых балансов): DP по маскам — `dp[mask]` = максимальное число групп с нулевой суммой; восстанавливаем разбиение. Внутри каждой группы — жадное сопоставление (крупнейший должник → крупнейший кредитор), что даёт `|группа| − 1` переводов. Итог: `n − число_групп`, а это и есть минимум.
  - n > 12: жадно по всему множеству.
  - Детерминизм: при равных суммах выигрывает меньший индекс во входном порядке; группы упорядочены по первому индексу.
  - Альтернатива — только жадный алгоритм. Он проще, но не минимален: на балансах {+2, +2, +3, −3, −4} он делает 4 перевода, а минимум — 3 (группы {+3, −3} и {+2, +2, −4}).
- `src/entities/debt/model/bill/` — доменные функции: `computeBillShares` (копейки, раздача остатка по порядку), `computeBillBalances`, `computeBillTransfers` (обёртка над `minimizeTransfers` с «Я»), `computeMyBillDebts` (переводы с «Я» → `{ contactId, direction, amount }`), `computeBillStatus`, `validateBill` (коды ошибок из spec «Проверка счёта перед сохранением»).
- Все суммы внутри — целые копейки (`Math.round(x * 100)`), на выходе — `roundAmount`.

### 3. Слайсы FSD

Модель счёта живёт в `entities/debt`, а не в новом `entities/bill`: стор один (создание счёта атомарно создаёт долги), а кросс-импорт между entities потребовал бы `@x`. Слайс `debt` и так шире «долга» — в нём контакты и курс.

| Слой | Что |
|------|-----|
| `shared/lib/storage` | `schema.ts` (`PersistedBill`, `billId`), `indexed-db-adapter.ts` (v2), `contract.ts` (`getAllBills`, `putBillWithDebts`, `deleteBillCascade`, `replaceAll` с `bills`), `backup.ts` (v2, чтение v1) |
| `shared/lib/settlement` | `minimizeTransfers` |
| `entities/debt` | `model/bill/*`; в сторе `billsById` и actions `createBill`, `updateBill`, `deleteBill`, `setBillManualClosed`; UI `BillRow`, `BillMyPart` (плашка «+X / −X / без меня»), `BillLink` (метка «Из счёта») |
| `features/create-bill` | двухшаговая форма (`BillForm`), режим создания и изменения; переиспользует `select-contact` (мультивыбор — новый проп `ContactPicker`), `shared/ui/AmountField`, `CurrencyPicker`, `components/ui/segmented-control` |
| `features/delete-bill` | `showDeleteBillConfirm` поверх `ConfirmActionModal` |
| `features/toggle-bill-closed` | кнопка «Закрыть / Открыть счёт» |
| `widgets/bill-detail` | экран счёта |
| `widgets/home-screen` | секция «Счета» |
| `widgets/contact-detail` | `DebtCard` / `ClosedDebtRow` — `BillLink` |
| `features/edit-debt` | блокировка полей у долга из счёта, кнопка «Открыть счёт» |
| `features/import-backup` | строка «Счетов» |
| `pages` | `create-bill` (`/bills/new`), `bill-detail` (`/bills/:billId`), `edit-bill` (`/bills/:billId/edit`) — lazy |
| `app/layout` | `CreateFab` с меню (Radix `DropdownMenu` / `Popover`), `useShellMode` — fullscreen для `/bills/*`, `useSideNavSection` — «Главная» |

Удаление долга из счёта (`DebtCard` → «Удалить») вызывает `showDeleteBillConfirm` вместо `showDeleteDebt` — решение принимает виджет по `debt.billId`.

### 4. Атомарность записи

Новые методы адаптера в одной транзакции `readwrite` над `bills`, `debts`, `debtOperations`:
- `putBillWithDebts(bill, upsertDebts, upsertOperations, deleteDebtIds)` — создание и правка счёта;
- `deleteBillCascade(billId)` — счёт, долги по индексу `by-billId` и их операции.

Стор делает оптимистичное обновление всех трёх коллекций и откатывает их одним снимком при ошибке, как в `createDebt`.

Правка счёта до погашений: новые «мои долги» сопоставляются со старыми по (`contactId`, `direction`). Совпавшие обновляются (сумма, валюта, заметка + операция `initial`) с прежним `id`, лишние удаляются, новые создаются. Дата создания сохранённых долгов не меняется.

### 5. Миграция IndexedDB

`DB_VERSION = 2`, в `upgrade(db, oldVersion, _, tx)`:
- `oldVersion < 1` — текущее создание сторов;
- `oldVersion < 2` — `createObjectStore("bills")`, `tx.objectStore("debts").createIndex("by-billId", "billId")`.

Существующие долги не переписываются: отсутствующее `billId` нормализуется в `null` при чтении (`hydrate`), поэтому индекс не содержит старых записей, и это нормально. `CURRENT_SCHEMA_VERSION = 2` пишется в `meta` при первой записи.

### 6. Резервная копия

`DebtsBackupPayload` = `{ version: 2, …, bills }`. `parseDebtsBackup` принимает `version: 1` (`bills = []`, `billId = null` у долгов) и `version: 2`; проверяет, что `billId` каждого долга указывает на существующий счёт, иначе обнуляет его. Сводка импорта получает `billsCount`.

### 7. Маршруты и навигация

`/bills/new[?from=]`, `/bills/:billId`, `/bills/:billId/edit`. Откуда открыт экран счёта — `location.state.from` (`"home" | "contact"` + `contactId`), как у карточки контакта. После создания — `navigate(/bills/:id, { replace: true })`, чтобы «назад» не возвращал в форму.

## Risks / Trade-offs

- [Минимальная схема меняет пары при небольшой правке счёта: Петя переводил Анне, а теперь Ивану] → правка разрешена только до погашений, долги сопоставляются по контакту и направлению; итог детерминирован.
- [DP 2^12 = 4 096 масок на каждый ввод в форме] → это микросекунды; при n > 12 — жадный алгоритм; расчёт мемоизирован по входу формы.
- [Старые версии приложения не прочитают копию v2] → указано в CHANGELOG как изменение формата; актуальная версия обновляется через PWA-уведомление.
- [Удаление долга удаляет весь счёт — неожиданно для пользователя] → отдельный текст подтверждения с названием счёта и числом долгов; альтернатива (отвязать долг) ломает итог «Кто кому переводит».
- [Контакты-участники без долгов засоряют «Контакты»] → осознанно: экран показывает «Нет долгов»; управление контактами — отдельный пункт roadmap.
- [Тексты интерфейса в specs — до макетов] → первая UI-задача сверяет specs с макетами по брифу и правит их через `/opsx:update`.

## Migration Plan

1. Выпуск с `DB_VERSION = 2`: при первом открытии IndexedDB выполняет `upgrade`, данные не переписываются.
2. Откат на версию без счетов невозможен на том же профиле: IndexedDB v2 не откроется кодом с `DB_VERSION = 1` (VersionError). Путь отката — экспорт копии и импорт в новую версию. В CHANGELOG — заметка о формате.

## Open Questions

- Меню «+» на десктопе: всплывающее у кнопки в углу или пунктами в боковом меню — решается в макетах, на модель и задачи не влияет.
- Один экран формы вместо двух шагов — вопрос брифа; если макеты предложат один экран, меняются только тексты шагов в spec `bills`.
