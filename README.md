# Expense Tracker API

Base URL: `http://localhost:3000`

## Endpoints

### `GET /health`

Checks that the API is running.

Example request:
```bash
curl -X GET http://localhost:3000/health
```

Example response:
```json
{
  "success": true
}
```

---

### `GET /transactions`

Returns transactions with optional filters.

Query params:
- `page` (number, default `1`)
- `limit` (number, default `10`, max `100`)
- `date` (ISO date, exact day filter)
- `createdFrom` (ISO date, range start)
- `createdTo` (ISO date, range end)
- `category` (string)
- `type` (`income` or `expense`)

Notes:
- Use either `date` OR `createdFrom`/`createdTo`, not both.

Example request:
```bash
curl -G http://localhost:3000/transactions \
  --data-urlencode "page=1" \
  --data-urlencode "limit=10" \
  --data-urlencode "type=expense" \
  --data-urlencode "createdFrom=2026-01-01" \
  --data-urlencode "createdTo=2026-01-31"
```

Example success response (`200`):
```json
{
  "success": true,
  "data": [
    {
      "_id": "67cc00112233445566778899",
      "title": "Groceries",
      "amount": 120,
      "transactionType": "expense",
      "category": "food",
      "date": "2026-01-10T00:00:00.000Z",
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-10T10:00:00.000Z",
      "__v": 0
    }
  ]
}
```

Example validation error (`400`, Zod query validation):
```json
{
  "success": false,
  "errors": [
    {
      "path": "type",
      "message": "Invalid option: expected one of \"income\"|\"expense\"",
      "code": "invalid_value"
    }
  ]
}
```

Example not found (`404`):
```json
{
  "success": false,
  "error": "no transactions found for the provided query"
}
```

---

### `POST /transactions`

Creates a transaction.

Body fields:
- `title` (required)
- `amount` (required, integer > 0)
- `transactionType` (required: `income` or `expense`)
- `category` (required when `transactionType=expense`)
- `date` (required, ISO date)

Example request:
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Salary",
    "amount": 3000,
    "transactionType": "income",
    "date": "2026-01-01"
  }'
```

Example success response (`201`):
```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "67cc009922334455667788aa",
      "title": "Salary",
      "amount": 3000,
      "transactionType": "income",
      "date": "2026-01-01T00:00:00.000Z",
      "createdAt": "2026-01-01T09:00:00.000Z",
      "updatedAt": "2026-01-01T09:00:00.000Z",
      "__v": 0
    }
  }
}
```

Example validation error (`400`, express-validator):
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "title is required",
      "path": "title",
      "location": "body"
    }
  ]
}
```

---

### `GET /transactions/stats`

Returns monthly statistics.

Query params:
- `month` (1-12)
- `year` (1900-current year)

Notes:
- `month` and `year` must be sent together.

Example request:
```bash
curl -G http://localhost:3000/transactions/stats \
  --data-urlencode "month=1" \
  --data-urlencode "year=2026"
```

Example success response (`200`):
```json
{
  "success": true,
  "data": [
    {
      "year": 2026,
      "month": 1,
      "totalIncome": 3500,
      "totalExpenses": 1400,
      "balance": 2100,
      "expenseByCategory": [
        {
          "category": "food",
          "totalExpense": 600,
          "percentOfExpenses": 42.86
        },
        {
          "category": "transport",
          "totalExpense": 800,
          "percentOfExpenses": 57.14
        }
      ]
    }
  ]
}
```

Example validation error (`400`, Zod query validation):
```json
{
  "success": false,
  "errors": [
    {
      "path": "month.year",
      "message": "month and year must be provided together",
      "code": "custom"
    }
  ]
}
```

Example not found (`404`):
```json
{
  "success": false,
  "error": "no statistics available for this query"
}
```

## MongoDB Aggregation Pipeline (Stats)

The stats endpoint uses `Transaction.aggregate()` with these stages:

1. `$match`
- Filters transactions by date range `[from, to)`.

2. First `$group`
- Groups data by month (`$dateTrunc`).
- Computes:
  - `totalIncome`
  - `totalExpenses`
  - an array of expense records (`category`, `amount`) for later category totals.

3. `$unwind`
- Expands expense records so each category expense can be grouped.

4. Second `$group`
- Sums expense totals per category.
- Keeps month-level totals (`totalIncome`, `totalExpenses`).

5. Third `$group`
- Rebuilds one monthly document with:
  - `expenseByCategory`
  - `totalIncome`
  - `totalExpenses`

6. `$project`
- Formats final response:
  - `year`, `month`
  - `balance = totalIncome - totalExpenses`
  - category percentages (`percentOfExpenses`) with safe divide-by-zero handling.
