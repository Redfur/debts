# Домен

## Принципы

- Стабильные идентификаторы: `id` у сущностей, хранимых в БД — строка (UUID, `crypto.randomUUID()`).
- Время: `createdAt`/`updatedAt`/`closedAt` — ISO 8601 (UTC).
- Деньги: суммы — `number`, округляются до 2 знаков (`roundAmount`) на каждой операции, чтобы избежать погрешности плавающей точки.

## TypeScript-модели (`src/shared/lib/storage/schema.ts`, домен — `src/entities/debt/model/types.ts`)

### Contact

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | UUID |
| `name` | string | Имя, введённое пользователем |
| `colorValue` | string | hex-цвет аватара, детерминирован по имени (`pickContactColor`) |
| `createdAt` / `updatedAt` | string | ISO |
| `archivedAt` | string \| null | Зарезервировано; архивирование контактов не реализовано в MVP |

### Debt

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | UUID |
| `contactId` | string | Ссылка на `Contact` |
| `direction` | `"i_owe" \| "owed_to_me"` | Кто кому должен |
| `currency` | `"RUB" \| "USD" \| "EUR" \| "CNY"` | Валюта записи |
| `principalAmount` | number | Исходная сумма долга |
| `note` | string \| null | Заметка |
| `status` | `"active" \| "closed"` | `closed` — когда остаток достиг 0 |
| `createdAt` / `updatedAt` | string | ISO |
| `closedAt` | string \| null | Момент полного погашения |

### DebtOperation

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | UUID |
| `debtId` | string | Ссылка на `Debt` |
| `kind` | `"initial" \| "repayment"` | Тип операции |
| `amount` | number | Сумма операции (всегда положительная) |
| `note` | string \| null | Заметка к операции |
| `createdAt` | string | ISO |

**Остаток долга:** `computeDebtBalance(debt, operations) = max(0, principalAmount − Σ(repayment.amount))`.

### ExchangeRatesCache (в `meta`, не часть домена долгов)

| Поле | Тип | Описание |
|------|-----|----------|
| `base` | CurrencyCode | Базовая валюта источника (`USD`) |
| `date` | string | Дата курса от источника (`YYYY-MM-DD`) |
| `fetchedAt` | string | ISO, момент локального сохранения |
| `rates` | `Record<CurrencyCode, number>` | Курсы к `base` |

## Примеры данных

### Contact

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

### Debt + DebtOperation (частично погашенный долг)

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
  {
    "id": "op-1",
    "debtId": "550e8400-e29b-41d4-a716-446655440001",
    "kind": "initial",
    "amount": 1000,
    "note": null,
    "createdAt": "2026-06-01T10:00:00.000Z"
  },
  {
    "id": "op-2",
    "debtId": "550e8400-e29b-41d4-a716-446655440001",
    "kind": "repayment",
    "amount": 300,
    "note": "Перевёл частично",
    "createdAt": "2026-06-15T09:00:00.000Z"
  }
]
```

Остаток: `1000 − 300 = 700 ₽`.

### ExchangeRatesCache

```json
{
  "base": "USD",
  "date": "2026-07-02",
  "fetchedAt": "2026-07-02T06:00:00.000Z",
  "rates": { "RUB": 92.5, "USD": 1, "EUR": 0.92, "CNY": 7.2 }
}
```
