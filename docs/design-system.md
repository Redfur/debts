# Дизайн-система «Долги»

Источник — холст «Долги — макеты» (артборд «Дизайн-система»): https://claude.ai/artifact/WvrA2LcghqTn3ZJMCCQM8b. Бриф для дизайнера — [`design-brief.md`](design-brief.md), поведение — `openspec/specs/design-system/spec.md`.

Все значения живут в [`src/index.css`](../src/index.css): переменные в `:root` (светлая тема) и `.dark` (тёмная), маппинг в утилиты Tailwind — в `@theme inline`. В компонентах используются только утилиты по токенам (`bg-owed-to-me-muted`, `rounded-card`, `shadow-card`), а не hex-значения.

## Цвета

Роли shadcn (`background`, `card`, `primary`…) сохранены, к ним добавлены продуктовые роли:

- `owed-to-me*` — «Мне должны» (зелёный), `i-owe*` — «Я должен» (терракотовый). Суффиксы: без суффикса — графика и иконки, `-muted` — подложка, `-strong` — текст на подложке, `-foreground` — текст на заливке;
- `accent*` — индиго для создания («+», «Создать», ссылки, кольцо фокуса);
- `destructive*` — необратимые действия и ошибки;
- `success*`, `warning*` — статусы («Погашен», «Нет курса»);
- `nav-glass*` — полупрозрачное нижнее меню, `scrim` — затемнение под шторками;
- `avatar-N` / `avatar-N-foreground` — 8 пар «фон / буква» аватаров. Сохранённый цвет контакта (hex из старой палитры) переводится в номер пары функцией `avatarPaletteIndex` (`shared/config/contact-colors.ts`).

| Токен | Светлая | Тёмная | Tailwind |
|---|---|---|---|
| `--background` | `#f4f5f7` | `#0f1115` | `bg-/text-/border-background` |
| `--foreground` | `#171a21` | `#edeff3` | `bg-/text-/border-foreground` |
| `--card` | `#ffffff` | `#191c22` | `bg-/text-/border-card` |
| `--card-foreground` | `#171a21` | `#edeff3` | `bg-/text-/border-card-foreground` |
| `--popover` | `#ffffff` | `#191c22` | `bg-/text-/border-popover` |
| `--popover-foreground` | `#171a21` | `#edeff3` | `bg-/text-/border-popover-foreground` |
| `--primary` | `#171a21` | `#edeff3` | `bg-/text-/border-primary` |
| `--primary-foreground` | `#ffffff` | `#0f1115` | `bg-/text-/border-primary-foreground` |
| `--secondary` | `#f4f5f7` | `#262a32` | `bg-/text-/border-secondary` |
| `--secondary-foreground` | `#171a21` | `#edeff3` | `bg-/text-/border-secondary-foreground` |
| `--muted` | `#e7e9ee` | `#262a32` | `bg-/text-/border-muted` |
| `--muted-foreground` | `#5f6672` | `#9aa1ad` | `bg-/text-/border-muted-foreground` |
| `--accent` | `#4338ca` | `#8b93ff` | `bg-/text-/border-accent` |
| `--accent-foreground` | `#ffffff` | `#0f1115` | `bg-/text-/border-accent-foreground` |
| `--destructive` | `#b3261e` | `#f2786d` | `bg-/text-/border-destructive` |
| `--destructive-foreground` | `#ffffff` | `#0f1115` | `bg-/text-/border-destructive-foreground` |
| `--destructive-muted` | `#fce8e6` | `#3b1a17` | `bg-/text-/border-destructive-muted` |
| `--destructive-strong` | `#8c1d18` | `#ffb4ab` | `bg-/text-/border-destructive-strong` |
| `--border` | `#e7e9ee` | `#2a2e37` | `bg-/text-/border-border` |
| `--input` | `#e7e9ee` | `#2a2e37` | `bg-/text-/border-input` |
| `--ring` | `#4338ca` | `#8b93ff` | `bg-/text-/border-ring` |
| `--owed-to-me` | `#0f7a55` | `#4fd1a0` | `bg-/text-/border-owed-to-me` |
| `--owed-to-me-foreground` | `#ffffff` | `#0f1115` | `bg-/text-/border-owed-to-me-foreground` |
| `--owed-to-me-muted` | `#ddf3ea` | `#12302a` | `bg-/text-/border-owed-to-me-muted` |
| `--owed-to-me-strong` | `#0b5e41` | `#7be3bc` | `bg-/text-/border-owed-to-me-strong` |
| `--i-owe` | `#b4432f` | `#ff8a70` | `bg-/text-/border-i-owe` |
| `--i-owe-foreground` | `#ffffff` | `#0f1115` | `bg-/text-/border-i-owe-foreground` |
| `--i-owe-muted` | `#f9e5df` | `#3a1e18` | `bg-/text-/border-i-owe-muted` |
| `--i-owe-strong` | `#9a3524` | `#ffa894` | `bg-/text-/border-i-owe-strong` |
| `--success` | `#1a7f37` | `#57d27f` | `bg-/text-/border-success` |
| `--success-muted` | `#ddf4e4` | `#13301c` | `bg-/text-/border-success-muted` |
| `--warning` | `#8a5a00` | `#f2b84b` | `bg-/text-/border-warning` |
| `--warning-muted` | `#fcefd2` | `#3a2c0e` | `bg-/text-/border-warning-muted` |
| `--accent-muted` | `#e4e6fb` | `#252845` | `bg-/text-/border-accent-muted` |
| `--accent-strong` | `#2a2f7a` | `#b8bdfa` | `bg-/text-/border-accent-strong` |
| `--nav-glass` | `rgba(255, 255, 255, 0.72)` | `rgba(30, 33, 40, 0.72)` | `bg-/text-/border-nav-glass` |
| `--nav-glass-active` | `rgba(23, 26, 33, 0.07)` | `rgba(255, 255, 255, 0.1)` | `bg-/text-/border-nav-glass-active` |
| `--scrim` | `rgba(15, 17, 21, 0.4)` | `rgba(0, 0, 0, 0.5)` | `bg-/text-/border-scrim` |
| `--avatar-1` | `#e4e6fb` | `#252845` | `bg-/text-/border-avatar-1` |
| `--avatar-1-foreground` | `#3a3f9e` | `#b8bdfa` | `bg-/text-/border-avatar-1-foreground` |
| `--avatar-2` | `#fde8d7` | `#3d2818` | `bg-/text-/border-avatar-2` |
| `--avatar-2-foreground` | `#8a4310` | `#f8c8a0` | `bg-/text-/border-avatar-2-foreground` |
| `--avatar-3` | `#e1f0fa` | `#16303f` | `bg-/text-/border-avatar-3` |
| `--avatar-3-foreground` | `#1b5880` | `#a6d4f2` | `bg-/text-/border-avatar-3-foreground` |
| `--avatar-4` | `#f1e3f5` | `#352040` | `bg-/text-/border-avatar-4` |
| `--avatar-4-foreground` | `#7a2e86` | `#e2b5ea` | `bg-/text-/border-avatar-4-foreground` |
| `--avatar-5` | `#fff1cc` | `#3a2e0c` | `bg-/text-/border-avatar-5` |
| `--avatar-5-foreground` | `#7a5300` | `#f5d68a` | `bg-/text-/border-avatar-5-foreground` |
| `--avatar-6` | `#e3e6ec` | `#2a2e37` | `bg-/text-/border-avatar-6` |
| `--avatar-6-foreground` | `#3b4252` | `#c9ced8` | `bg-/text-/border-avatar-6-foreground` |
| `--avatar-7` | `#d8f3f5` | `#12343a` | `bg-/text-/border-avatar-7` |
| `--avatar-7-foreground` | `#0e5a62` | `#9fe0e8` | `bg-/text-/border-avatar-7-foreground` |
| `--avatar-8` | `#fce4ef` | `#3d1a2c` | `bg-/text-/border-avatar-8` |
| `--avatar-8-foreground` | `#8a1f55` | `#f4b3d2` | `bg-/text-/border-avatar-8-foreground` |

## Типографика

Шрифт — Onest Variable (`@fontsource-variable/onest`), у `body` включены табличные цифры (`tabular-nums`). Шкала — собственные утилиты `@utility` в `src/index.css`; их знает `tailwind-merge` (`shared/lib/utils.ts`), поэтому `cn()` не выбрасывает их рядом с цветом текста.

| Утилита | Размер / интерлиньяж | Насыщенность, трекинг | Где |
|---|---|---|---|
| `text-amount-display` | 36 / 44 | 700, −3% | итоги на главной |
| `text-amount-xl` | 34 / 40 | 700, −3% | сводка контакта, поле погашения |
| `text-amount-l` | 22 / 28 | 700, −2% | остаток на карточке долга |
| `text-title` | 28 / 34 | 700, −2,5% | заголовок экрана (мобильный) |
| `text-title-desktop` | 32 / 40 | 700, −2,5% | заголовок экрана (от 1024 px) |
| `text-heading` | 17 / 24 | 600 | заголовки секций и шапки «Новый долг» |
| `text-body` | 16 / 22 | — | основной текст, поля ввода |
| `text-body-s` | 14 / 20 | — | вторичный текст |
| `text-caption` | 13 / 18 | — | подписи, подсказки, ошибки под полями |
| `text-label-nav` | 11 / 14 | — | подписи нижнего меню |

Поле суммы в форме долга — 44 / 52, 700, −3% (`AmountField`).

## Радиусы

| Токен | Значение | Tailwind |
|---|---|---|
| `--radius` | `14px` | база для `rounded-sm…2xl` |
| `--radius-chip` | `8px` | `rounded-chip` |
| `--radius-field` | `14px` | `rounded-field` |
| `--radius-control` | `18px` | `rounded-control` |
| `--radius-card` | `22px` | `rounded-card` |
| `--radius-sheet` | `28px` | `rounded-sheet` |

Кнопки и чипы фильтров — пилюли (`rounded-full`).

## Тени

| Токен | Светлая | Тёмная | Tailwind |
|---|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(23, 26, 33, 0.06), 0 4px 16px rgba(23, 26, 33, 0.05)` | `none` | `shadow-card` |
| `--shadow-raised` | `0 12px 40px rgba(23, 26, 33, 0.18)` | `0 12px 40px rgba(0, 0, 0, 0.5)` | `shadow-raised` |
| `--shadow-nav` | `inset 0 0 0 1px rgba(23, 26, 33, 0.08), 0 8px 24px rgba(23, 26, 33, 0.1)` | `inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.4)` | `shadow-nav` |

В тёмной теме карточки без тени: поверхности различаются цветом (`card` светлее `background`).

## Компоненты

| Компонент | Слой | Назначение |
|---|---|---|
| `Button` | `components/ui/button` | Пилюля: `default` (тёмная основная), `accent` (создание), `secondary`/`outline`, `destructive`, `destructive-soft`, `destructive-ghost`, `ghost`, `link`; размеры `sm` 36, `default` 44, `lg` 52, `icon`, `icon-sm` |
| `Dialog`, `AlertDialog` | `components/ui` | До 1024 px — шторка снизу (радиус `sheet`, ручка), шире — диалог по центру; классы `modalContentClass` / `modalOverlayClass` |
| `Input`, `Textarea`, `AmountInput` | `components/ui` | Поле 48 px, `rounded-field`, фон `secondary`, внутреннее кольцо фокуса; `AmountInput` — маска разрядов |
| `Badge`, `SegmentedControl`, `Collapsible`, `Skeleton`, `Toaster` | `components/ui` | Бейджи статусов, переключатель темы, история долга, скелетоны, тосты над нижним меню |
| `AmountField`, `CurrencyPicker` | `shared/ui` | Крупная сумма с кнопкой валюты; шторка выбора валюты |
| `SearchField`, `HighlightMatch` | `shared/ui` | Поиск с «Очистить»; выделение совпадения жирным |
| `FieldError`, `FormAlert` | `shared/ui/form-message` | Ошибка под полем; общая ошибка над кнопкой |
| `EmptyState`, `CurrencyBreakdown`, `ConfirmActionModal` | `shared/ui` | Пустые состояния; «10 000 ₽ + 250 $»; подтверждения |
| `PageHeader`, `PageHeaderBackLink`, `ScreenBody` | `shared/layout` | Заголовок экрана и слот баннера под ним; «назад»; тело экрана |
| `AmountPill`, `DirectionIcon`, `DirectionChip`, `DirectionToggle`, `DebtStatusBadge` | `entities/debt/ui` | Кодирование направления «+» / «−» цветом и подписью; статус долга |
| `ContactAvatar`, `ContactRow`, `ContactRowList` | `entities/debt/ui` | Аватар с буквой; строка контакта с плашками остатков |
| `NetPositionLine`, `RatioBar` | `entities/debt/ui` | Чистая позиция |
| `ContactPicker` | `features/select-contact` | Выбор контакта в форме долга |
| `DisplayCurrencySetting`, `ExchangeRateStatusRow` | `features/set-display-currency`, `features/refresh-exchange-rates` | Строки настроек «Валюта итогов» и «Курс валют» |
| `InstallOnboardingCard`, `InstallBanner`, `InstallSettingsRows` | `features/install-app` | Приглашение установить (карточка `card` со знаком приложения, у плашки — «Закрыть»); строки «Установка» / «Хранение данных» со статусом `success` / `warning` / `muted-foreground` и иконкой |
| `BottomNav`, `CreateFab`, `SideNav`, `StorageErrorBanner` | `app/layout` | Каркас: стеклянное нижнее меню, «+», боковое меню, баннер ошибки хранилища |

## Контраст

`npm run tokens:contrast` (`scripts/check-contrast.mjs`, шаг CI) проверяет пары токенов в обеих темах по WCAG 2.1 AA: 4,5:1 для текста, 3:1 для крупного текста и графики. Полупрозрачные цвета смешиваются с фоном пары.

- Текст: `foreground` и `muted-foreground` на `background` / `card` / `nav-glass`; `*-foreground` на заливках `primary`, `secondary`, `accent`, `destructive`, `owed-to-me`, `i-owe`; `*-strong` на `*-muted` для `accent`, `destructive`, `owed-to-me`, `i-owe`; `foreground` на `owed-to-me-muted` и `i-owe-muted` (итоги на главной); `warning` на `warning-muted`; `destructive` на `card`; `avatar-N-foreground` на `avatar-N`.
- Текст статусов: `success` и `warning` на `card`.
- Графика (3:1): `accent` на `card` и `secondary`, `owed-to-me`, `i-owe` на `card`.

Новая пара цветов, которой показывается текст, добавляется в `PAIRS` скрипта.

## Иконка приложения

Знак приложения — карточка с рамкой и двумя полосами: зелёная `owed-to-me` во всю ширину и терракотовая `i-owe` на 60 %. В интерфейсе это `BrandMark` в боковом меню (`app/layout/SideNav.tsx`), в `public/` — иконки:

| Файл | Где | Вид |
|---|---|---|
| `favicon.svg` | вкладка браузера | карточка с рамкой; тёмный вариант через `prefers-color-scheme` внутри SVG |
| `favicon-96x96.png`, `favicon.ico` (16/32/48) | старые браузеры, закладки | растр из `favicon.svg` (светлый) |
| `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png` | установленное PWA (maskable) | белый фон на весь квадрат, полосы в безопасной зоне (центральные 80 %) |
| `pwa-192x192.png`, `pwa-512x512.png` | диалог установки, окно на десктопе (`any`) | карточка 432 на 512 с рамкой 22 px и прозрачными углами |
| `shortcut-new-debt.png`, `shortcut-split.png` (96) | ярлыки на иконке | квадрат `accent` с белым глифом Lucide `ArrowLeftRight` / `Split` |
| `apple-touch-icon.png` (180) | ярлык iOS | как maskable |

`theme_color` и `background_color` манифеста (`vite.config.ts`) и `<meta name="theme-color">` в `index.html` — токен `background` (`#f4f5f7`, в тёмной теме `#0f1115`). При смене знака растровые файлы перерисовываются из SVG.

## Правила

- **Направление долга** всегда кодируется тремя способами: знак «+» / «−», цвет роли и подпись «Мне должны» / «Я должен». Цвет не используется один.
- **Суммы** форматируются `formatMoney` (`shared/lib/format-amount`): разряды через пробел, неразрывный пробел перед символом валюты («10 000 ₽»). Цифры табличные.
- **Даты** — `shared/lib/format-date`: «12 сен» (в другом году «12 сен 2025»), «15 октября», «15 октября в 12:40», «12 октября 2026, 18:05».
- **Зона касания** любого интерактивного элемента — не меньше 44×44 px: у кнопок встроена утилита `touch-target`, у мелких элементов — `touch-target` или явный размер 44.
- **Шторка или диалог:** формы и подтверждения открываются в `Dialog` / `AlertDialog` — на мобильном это шторка снизу с ручкой, на десктопе диалог по центру. Кнопки внизу шторки: вторичная «Отмена» слева, основное действие справа (вдвое шире).
- **Поверхности без обводок:** карточки отделяются тенью `shadow-card` (в тёмной теме — цветом), разделители внутри списков — 1 px `border` с отступом от аватара.
- **Фокус:** кольцо `ring` 2 px с отступом 2 px у кнопок, внутреннее кольцо у полей. Ошибка поля — внутреннее кольцо `destructive` и `FieldError` под полем (связь через `aria-describedby`).
- **Тёмная тема** включается классом `.dark` на `<html>`: компоненты не используют `dark:` для цветов, если хватает токенов.
