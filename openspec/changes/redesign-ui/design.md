# Design

## Context

Мотивация и состав — в `proposal.md`, поведение — в дельтах `specs/`. Источник визуальных решений — холст «Долги — макеты» (https://claude.ai/artifact/WvrA2LcghqTn3ZJMCCQM8b). Ниже ссылки вида `[HomeB]` — это названия артбордов.

Текущее состояние кода, которое определяет подход:

- **`src/index.css`.** Переменные shadcn в oklch (монохром) и неиспользуемые переменные шаблона Vite. Шрифт Geist (`@fontsource-variable/geist`).
- **Кнопки** `components/ui/button.tsx`: высота 32 px (`h-8`), радиус `rounded-lg`. Шторок и сегментированного переключателя нет. Модалки — shadcn `Dialog` / `AlertDialog` через NiceModal.
- **`AppShell`.** Нижняя панель меньше 1024 px, боковая колонка от 1024 px. Меню видно на всех маршрутах. Активный раздел для `/contacts/:id` — по `location.state.from`.
- **Агрегаты** `entities/debt/model`:
  - `computeGlobalTotals` — конвертирует в валюту отображения;
  - `computeContactSummary` — только разбивка по валютам, без конвертации.
- **Аватар.** `colorValue` (hex из 8 цветов Tailwind) хранится в IndexedDB, буква белая.
- **Резервная копия.** Импорт и экспорт живут внутри `widgets/settings-screen` (`BackupActionsCard`). Главная (онбординг) не может переиспользовать виджет по правилам FSD.
- **Даты** — `format(..., "d MMM yyyy", { locale: ru })` в `DebtCard`. Курс и импорт показываются сырыми строками.
- **Тестов нет.** Проверки: Biome, knip, `tsc` в `build`, `openspec validate`.

## Goals / Non-Goals

**Goals:**

- Экраны совпадают с макетами на 390 px и 1440 px в обеих темах.
- Все цвета, радиусы, тени и типографика идут из токенов. В слайсах нет сырых цветов.
- Модель данных и формат бэкапа не меняются.
- Работу можно разбить на несколько PR. Приложение остаётся рабочим после каждой группы задач.

**Non-Goals:**

- Разделение счёта — отдельное изменение. Меню «+» с двумя пунктами появится там же.
- Меню «Действия с контактом».
- Собственная экранная клавиатура: в макетах это системная клавиатура, используется `inputmode="decimal"`.
- Жесты свайпа для шторок.

## Decisions

### 1. Токены — значения из артборда [StyleB], в `src/index.css`

Цвета задаются в hex/rgba, как в макетах. Роли shadcn сохраняют имена, поэтому UI-кит работает без переименований. Роли продукта регистрируются в `@theme inline` как `--color-*`.

| Токен | light | dark |
|---|---|---|
| background | #F4F5F7 | #0F1115 |
| foreground | #171A21 | #EDEFF3 |
| card, popover | #FFFFFF | #191C22 |
| primary / -foreground | #171A21 / #FFFFFF | #EDEFF3 / #0F1115 |
| secondary | #F4F5F7 | #262A32 |
| muted | #E7E9EE | #262A32 |
| muted-foreground | #5F6672 | #9AA1AD |
| accent / -foreground | #4338CA / #FFFFFF | #8B93FF / #0F1115 |
| destructive / -muted | #B3261E / #FCE8E6 | #F2786D / #3B1A17 |
| border, input | #E7E9EE | #2A2E37 |
| ring | #4338CA | #8B93FF |
| owed-to-me / -foreground / -muted / -strong | #0F7A55 / #FFFFFF / #DDF3EA / #0B5E41 | #4FD1A0 / #0F1115 / #12302A / #7BE3BC |
| i-owe / -foreground / -muted / -strong | #B4432F / #FFFFFF / #F9E5DF / #9A3524 | #FF8A70 / #0F1115 / #3A1E18 / #FFA894 |
| success / -muted | #1A7F37 / #DDF4E4 | #57D27F / #13301C |
| warning / -muted | #8A5A00 / #FCEFD2 | #F2B84B / #3A2C0E |
| nav-glass | rgba(255,255,255,.72) | rgba(30,33,40,.72) |

- **Внимание:** у shadcn `accent` обычно означает фон наведения. Здесь, по макетам, это индиго для создания, «+», ссылок и фокуса.
  - Компоненты UI-кита, которые используют `bg-accent` для наведения (`command`, `select`, `dropdown-menu`), переводятся на `bg-secondary`.
  - Это шаг 1.3 в tasks.
- **Аватары `avatar-1…8` (фон / буква):**
  - light: `#E4E6FB/#3A3F9E`, `#FDE8D7/#8A4310`, `#E1F0FA/#1B5880`, `#F1E3F5/#7A2E86`, `#FFF1CC/#7A5300`, `#E3E6EC/#3B4252`, `#D8F3F5/#0E5A62`, `#FCE4EF/#8A1F55`;
  - dark для 1–4 из [HomeB]: `#252845/#B8BDFA`, `#3D2818/#F8C8A0`, `#16303F/#A6D4F2`, `#352040/#E2B5EA`;
  - dark для 5–8 подбираются по тому же правилу (тёмный фон того же тона, светлая буква) и проверяются скриптом контраста.
- **Радиусы:** `--radius-chip: 8px` (плашки сумм), `14px` (поля, строки), `18px` (переключатели, итоги, поле суммы), `22px` (карточки), `28px` (шторки), кнопки — `9999px`.
- **Тени:**
  - `--shadow-card: 0 1px 2px rgba(23,26,33,.06), 0 4px 16px rgba(23,26,33,.05)` — в тёмной теме `none`;
  - `--shadow-raised: 0 12px 40px rgba(23,26,33,.18)`;
  - стеклянное меню — `inset 0 0 0 1px rgba(23,26,33,.08), 0 8px 24px rgba(23,26,33,.10)`.
- **Типографика:**
  - Onest (`@fontsource-variable/onest`, офлайн);
  - `font-variant-numeric: tabular-nums` на `body`;
  - утилиты по шкале [StyleB]: `text-amount-display` (36/44, 700, −3 %), `text-amount-xl` (34/40), `text-amount-l` (22/28), `text-title` (28/34, 700, −2,5 %), `text-heading` (17/24, 600), `text-body` (16/22), `text-body-s` (14/20), `text-caption` (13/18), `text-label-nav` (11/14).
- **Отступы:** поля экрана 16 px на мобильном и 40 px на десктопе, шаг 4.

*Альтернатива — перевести значения в oklch.* Отклонена: hex совпадает с макетами один к одному и проще для скрипта контраста.

### 2. Примитивы UI-кита

- **`button`** переписывается под [StyleB]: пилюля, варианты `accent` / `primary` / `secondary` / `destructive` / `ghost`, размеры `default` 44 px и `lg` 52 px (формы, шторки), `icon` 44×44. Фокус — кольцо 2 px с отступом 2 px. Старые размеры `xs` / `sm` удаляются, все места вызова обновляются.
- **`badge`** — пилюля с вариантами `success-neutral` («✓ Погашен»: фон `muted`), `warning`, `destructive`.
- **`sheet`** — shadcn `sheet` на Radix Dialog, `side="bottom"`: радиус 28 сверху, ручка 36×5, отступ снизу `env(safe-area-inset-bottom)` + 16.
- **`segmented-control`** — `ToggleGroup` из `radix-ui` с `type="single"`. Используется для темы, фильтра на главной и направления в формах.
- **`shared/ui/responsive-dialog`** — выбирает `Sheet` на ширине меньше 1024 px и `Dialog` на большей. Решение принимает `useMediaQuery("(min-width: 1024px)")` в `shared/lib`. На него переводятся погашение, изменение, выбор валюты и `ConfirmActionModal`. NiceModal остаётся механизмом открытия.

*Альтернатива — `vaul` (drawer с жестами).* Отклонена: новая зависимость, а жесты не требуются.

### 3. Общие компоненты и слои FSD

| Компонент | Путь | Назначение |
|---|---|---|
| `Money` | `shared/ui/money` | Сумма + символ через ` `, `white-space: nowrap`, размеры по шкале |
| `CurrencyBreakdown` | `shared/ui/money` | «10 000 ₽ + 250 $» (для «нет курса» и сводки контакта) |
| `AmountPill` | `entities/debt/ui` | Плашка «+10 000 ₽» / «−2 300 ₽» в цветах направления + `aria-label` «Мне должны 10 000 ₽» |
| `DirectionChip` | `entities/debt/ui` | «+ Мне должны» / «− Я должен» на карточке долга |
| `DebtStatusBadge` | `entities/debt/ui` | «✓ Погашен» |
| `RatioBar` + `NetPositionLine` | `entities/debt/ui` | Полоса соотношения и строка чистой позиции (тексты — в переводах `entity-debt`) |
| `ContactRow` | `entities/debt/ui` | Аватар, имя, плашки / «Всё погашено» / «Нет долгов»; заменяет `ContactListItem` |
| `ContactAvatar` | `entities/debt/ui` | Токены `avatar-N` |
| `EmptyState` | `shared/ui/empty-state` | Иконка, заголовок, текст, действия |
| `SettingsGroup` / `SettingsRow` | `widgets/settings-screen/ui` | Группа с заголовком и строки «название + пояснение + значение / действие» |

Переводы «Мне должны» / «Я должен» и фразы чистой позиции живут в `entities/debt/translations.ts`. Дубли в `home-screen`, `contact-detail`, `create-debt`, `edit-debt` удаляются.

### 4. Агрегаты (`entities/debt/model`, чистые функции)

- `computeContactTotals(contactId, debts, ops, rates, displayCurrency)` возвращает:
  - `owedToMe`, `owedByMe` — `{ converted: number | null, byCurrency }`;
  - `hasActive`, `hasClosed`.

  Построена на `computeContactSummary` + `convertAmount`. Используется сводкой карточки контакта и статусом строки.
- `computeNetPosition(owedToMe, owedByMe)` → `{ kind: "owed-to-me" | "i-owe" | "balanced" | "none", diff }`. При `null` любой стороны — `none`.
- `countContactsByDirection(...)` → числа для фильтра «Все / Мне должны / Я должен».
- `computeGlobalTotals` не меняется. После нажатия на итог пересчёт идёт с новой `displayCurrency` из настройки.

### 5. Каркас, маршруты и раскладки (`src/app`)

- **Режим каркаса по маршруту.** `AppShell` получает режим из хука `useShellMode()` (рядом с `use-active-nav-section.ts`, через `useLocation` + `matchPath`). Приложение использует `BrowserRouter` + `<Routes>`, а не data-router, поэтому `useMatches` недоступен. Режимы:
  - `section` — `/`, `/contacts`, `/settings`: показаны меню и «+»;
  - `fullscreen` — `/new` и `/contacts/:id` на мобильном: меню и «+» скрыты.
- **Мобильная навигация (`app/layout`):**
  - `BottomNav` — стекло: `backdrop-filter: blur(20px) saturate(180%)`, `nav-glass`; фолбэк без поддержки — непрозрачный `card`;
  - `CreateFab` — круг 60 px, `accent`, ведёт на `/new`;
  - оба фиксированы на 24 px от низа плюс безопасная зона;
  - контенту даётся нижний отступ 110 px.
- **Десктоп:** `SideNav` — название, разделы, подпись внизу. `CreateFab` фиксирован в правом нижнем углу.
- **«Список + карточка» в контактах.** `/contacts` становится родительским маршрутом с дочерними `index` и `:contactId`:
  - от 1024 px: `ContactsLayout` рисует список слева (360 px) и `<Outlet/>` справа; при `index` справа пустое состояние «Выберите контакт»;
  - на мобильном: `index` — список, `:contactId` — полноэкранная карточка.

  Активный раздел на десктопе для `/contacts/:id` — всегда «Контакты». На мобильном меню на этом маршруте скрыто, `state.from` используется только для «назад».
- **Тосты.** Sonner `position="bottom-center"`, `offset` = 110 px на мобильном и 32 px на десктопе, `duration` 4000.
- **Баннер ошибки хранилища** рендерится под заголовком экрана: через `PageHeader` / слот `ScreenBody`, а не `fixed` поверх контента.

### 6. Главная (`widgets/home-screen`)

- **Валюта по нажатию.** Отдельного состояния нет. Нажатие на итог вызывает `setDisplayCurrency(next(current))` из `shared/lib/currency-preference`: это та же настройка в `localStorage`, что и «Валюта итогов» в настройках. Через существующее событие смены валюты пересчитываются итоги на главной, сводка контакта и строка в настройках. Хелпер `nextSupportedCurrency()` живёт рядом с `SUPPORTED_CURRENCIES` в `shared/config/currencies.ts`.
- **Фильтр** — `segmented-control` с числами. Ширина больше 1024 px — таблица [DeskHome]: «Контакт / Мне должны / Я должен / Открытых долгов» и третья карточка «Разница».
- **Онбординг** — `EmptyState` + кнопки. «Восстановить из резервной копии» вызывает фичу `features/import-backup` (решение 8).
- **Нет курса** — плашка `warning-muted` с текстом и кнопкой «Повторить» → `refreshRatesIfStale(true)`.

### 7. Новый долг и выбор контакта

- `CreateDebtPage` — полноэкранный режим: шапка «Отмена» слева и заголовок по центру.
- Форма из `features/create-debt` перестраивается:
  - строка выбранного контакта;
  - `segmented-control` направления с подсказкой (переводы с подстановкой имени: «{{name}} вернёт деньги вам» / «{{name}} ждёт деньги от вас»);
  - крупное поле суммы `AmountInput` размера `amount-display` и кнопка валюты, открывающая `responsive-dialog` со списком валют;
  - заметка;
  - нижняя панель с «Создать».
- **«Создать» над клавиатурой:**
  - в `index.html` в `meta viewport` добавляется `interactive-widget=resizes-content` (Chrome/Android сжимает layout-viewport);
  - панель — `position: sticky; bottom: 0` внутри прокручиваемой формы;
  - для iOS Safari, где layout-viewport не сжимается, используется `visualViewport` resize: отступ панели = высота клавиатуры. Это хук `shared/lib/use-keyboard-inset`.
- **Выбор контакта** (`features/select-contact`): `ContactCombobox` заменяется на `ContactPicker` — полноэкранная панель поверх формы (не маршрут), внутри поле поиска с автофокусом, список с подсветкой (`<mark>`) и `AmountPill`, пункт «Создать «…»». Закрытие — «назад» в шапке панели или выбор контакта.

### 8. Резервная копия — в фичи

Логика из `BackupActionsCard` выносится в `features/export-backup` (кнопка «Сохранить в файл») и `features/import-backup` (кнопка или хелпер `startImportBackup()`: выбор файла → `parseDebtsBackup` → шторка подтверждения). Их используют и `settings-screen`, и `home-screen`.

### 9. Настройки и статус курса

- `SettingsGroup` / `SettingsRow` по [Settings]. «Валюта итогов» открывает `responsive-dialog` со списком валют.
- **Статус курса** (`features/refresh-exchange-rates`):
  - `navigator.onLine` → хук `shared/lib/use-online-status` на событиях `online` / `offline`;
  - офлайн + кэш → «Нет сети · курс от 15 октября»;
  - онлайн + `ratesFetchError` → «Не удалось обновить» + «Повторить»;
  - иначе «Обновлён 15 октября в 12:40» (по `fetchedAt`) или «Ещё не загружен».
- **Десктоп [DeskSettings]:** строки сброса получают явные кнопки справа («Удалить данные», «Сбросить настройки», «Очистить всё»). На мобильном вся строка — кнопка.

### 10. Форматирование дат — `shared/lib/format-date.ts`

- `formatShortDate(d)` → «12 сен» / «12 сен 2025». Месяцы — свой массив: `янв фев мар апр мая июн июл авг сен окт ноя дек`, date-fns `ru` даёт «сент.».
- `formatLongDate(d)` → «15 октября» (родительный падеж, `d MMMM` из date-fns `ru`).
- `formatMoment(d)` → «15 октября в 12:40».
- `formatDateTimeWithYear(d)` → «12 октября 2026, 18:05».
- `YYYY-MM-DD` разбирается как локальная дата (`parseISO`).

### 11. Аватары: hex остаётся, цвет — из токенов

- В IndexedDB по-прежнему хранится hex из старой палитры, поэтому старые бэкапы и версии совместимы.
- `contact-colors.ts` получает функцию «hex → индекс 1…8» по позиции в старой палитре; новые контакты продолжают сохранять старый hex по имени.
- Цвета аватаров меняются, но у каждого контакта остаются стабильными.
- Hex вне палитры → `avatar-6` (нейтральный).

*Альтернатива — подбирать по оттенку.* Отклонена: новая палитра намеренно без чистых красного и зелёного (они заняты направлениями), поэтому сопоставление по оттенку склеило бы цвета.

### 12. Проверка контраста — `scripts/check-contrast.mjs`

- Скрипт на Node без зависимостей:
  - читает hex/rgba токенов `:root` и `.dark` из `src/index.css`;
  - проверяет пары: `foreground/background`, `muted-foreground/card`, `muted-foreground/background`, `*-strong/*-muted`, `*-foreground/*`, `accent-foreground/accent`, `destructive/card`, `avatar-N-foreground/avatar-N`, `warning/warning-muted`;
  - пороги 4.5 и 3.
- Подключается как `npm run tokens:contrast` и шаг CI.

## Risks / Trade-offs

- **[Большой объём]** → задачи разбиты на группы; каждую можно мержить отдельно, начиная с токенов и примитивов.
- **[Смена размеров `button` ломает существующие экраны до их миграции]** → группа 1 сразу обновляет все места вызова на новые размеры, визуально временно «крупнее»; дальше экраны переделываются по одному.
- **[`accent` в shadcn — фон наведения, а здесь индиго]** → явная миграция `bg-accent` в UI-ките на `bg-secondary`; поиск `grep -rn "bg-accent\|text-accent-foreground" src/components` после шага.
- **[iOS Safari не сжимает layout-viewport при клавиатуре]** → хук `use-keyboard-inset` на `visualViewport`. Если поведение окажется нестабильным — фолбэк: кнопка в конце формы, это приемлемо для сценария.
- **[`backdrop-filter` не везде поддерживается]** → `@supports` фолбэк на непрозрачный `card`.
- **[Скрытие разбивки по валютам на главной]** → решение по макету, подтверждено пользователем. Разбивка остаётся в состоянии «нет курса», в сводке контакта и в строках.
- **[Смена цветов аватаров]** → однократно при обновлении, описано в CHANGELOG.
- **[Двойная навигация на `/contacts/:id` (мобильный / десктоп)]** → маршруты одинаковые, отличается только раскладка; проверяется на ширинах 390 и 1440.

## Migration Plan

- Данные не мигрируют, формат бэкапа прежний.
- Порядок PR: группы tasks 1 → 2 → 3, затем экраны (4–9) в любом порядке, затем 10–11.
- Откат — revert. PWA подхватит предыдущую версию через уведомление об обновлении.

## Open Questions

- Значения тёмной темы для `avatar-5…8` в макетах не нарисованы. Подбираются по правилу из решения 1 и проверяются скриптом. Дизайнер может уточнить их позже, сменив только токены.
