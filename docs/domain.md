# Домен

Термины и модель данных. Нормативное поведение — в [`openspec/specs/`](../openspec/specs).

## Термины

| Термин | Значение |
|--------|----------|
| **Контакт (Contact)** | Человек, с которым связаны долги. Создаётся только из формы долга (по имени, без дублей без учёта регистра). Цвет аватара детерминирован по имени. Не удаляется, даже если долгов не осталось. |
| **Долг (Debt)** | Запись: контакт, направление, валюта, исходная сумма (`principalAmount`), заметка, статус. Направление/сумма/валюта редактируются, только пока нет погашений; заметка — всегда. |
| **Операция (DebtOperation)** | Событие истории долга: `initial` (создание, сумма = `principalAmount`) или `repayment` (погашение). |
| **Остаток** | `max(0, principalAmount − Σ repayment.amount)`. При 0 долг закрывается (`closed`). |
| **Направление** | `owed_to_me` — «Мне должны» (контакт должен пользователю); `i_owe` — «Я должен». Встречные долги не взаимозачитываются. |
| **Валюта отображения** | Настройка (по умолчанию RUB), в которую конвертируются только итоги на главной. |
| **Курс валют (ExchangeRatesCache)** | Курсы поддерживаемых валют к USD, кэш на устройстве, обновление не чаще раза в сутки. |
| **ContactSummary** | Остатки активных долгов одного контакта по валютам, раздельно по направлениям. |
| **GlobalTotals** | То же по всем контактам + конвертация в валюту отображения (`null`, если для какой-то валюты нет курса). |

```
Contact (1) ──< (N) Debt (1) ──< (N) DebtOperation ("initial" | "repayment")
```

## Принципы

- Идентификаторы — UUID (`crypto.randomUUID()`).
- Время — ISO 8601 (UTC).
- Суммы — `number`, округление до 2 знаков на каждой операции; всегда положительные (направление задаёт знак по смыслу).

## Модели (`src/shared/lib/storage/schema.ts`; доменные алиасы — `src/entities/debt/model/types.ts`)

### Contact

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | UUID |
| `name` | string | Имя (обрезано по краям) |
| `colorValue` | string | hex-цвет аватара из палитры 8 цветов, детерминирован по имени (`pickContactColor`) |
| `createdAt` / `updatedAt` | string | ISO |
| `archivedAt` | string \| null | Зарезервировано: фильтруется в списках, но архивирование не реализовано |

### Debt

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | UUID |
| `contactId` | string | Ссылка на `Contact` |
| `direction` | `"i_owe" \| "owed_to_me"` | Кто кому должен |
| `currency` | `"RUB" \| "USD" \| "EUR" \| "CNY"` | Валюта записи |
| `principalAmount` | number | Исходная сумма |
| `note` | string \| null | Заметка |
| `status` | `"active" \| "closed"` | `closed` — остаток достиг 0 |
| `createdAt` / `updatedAt` | string | ISO |
| `closedAt` | string \| null | Момент полного погашения |

### DebtOperation

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | UUID |
| `debtId` | string | Ссылка на `Debt` |
| `kind` | `"initial" \| "repayment"` | Тип |
| `amount` | number | Сумма (> 0) |
| `note` | string \| null | Заметка (у `initial` всегда `null`; заметка долга хранится в `Debt.note`) |
| `createdAt` | string | ISO |

### ExchangeRatesCache (в `meta`)

| Поле | Тип | Описание |
|------|-----|----------|
| `base` | CurrencyCode | `USD` |
| `date` | string | Дата курса от источника (`YYYY-MM-DD`) |
| `fetchedAt` | string | ISO, момент локального сохранения (для троттлинга) |
| `rates` | `Record<CurrencyCode, number>` | Курсы к `base` (`NaN`, если валюты нет в ответе) |

## Примеры данных

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "name": "Вася",
  "colorValue": "#3b82f6",
  "createdAt": "2026-06-01T10:00:00.000Z",
  "updatedAt": "2026-06-01T10:00:00.000Z",
  "archivedAt": null
}
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "contactId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "direction": "owed_to_me",
  "currency": "RUB",
  "principalAmount": 1000,
  "note": null,
  "status": "active",
  "createdAt": "2026-06-01T10:00:00.000Z",
  "updatedAt": "2026-06-15T09:00:00.000Z",
  "closedAt": null
}
```

```json
[
  { "id": "op-1", "debtId": "550e8400-e29b-41d4-a716-446655440001", "kind": "initial", "amount": 1000, "note": null, "createdAt": "2026-06-01T10:00:00.000Z" },
  { "id": "op-2", "debtId": "550e8400-e29b-41d4-a716-446655440001", "kind": "repayment", "amount": 300, "note": "Перевёл частично", "createdAt": "2026-06-15T09:00:00.000Z" }
]
```

Остаток: `1000 − 300 = 700 ₽`.

```json
{
  "base": "USD",
  "date": "2026-07-02",
  "fetchedAt": "2026-07-02T06:00:00.000Z",
  "rates": { "RUB": 92.5, "USD": 1, "EUR": 0.92, "CNY": 7.2 }
}
```
