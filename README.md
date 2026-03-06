# example server response
```ts
{
    success:boolean,
    errors:null | string ,
    data:{any: any} | null,
}
```

# example transaction stats 
```json
{
  "year": 2026,
  "month": 3,
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": "2026-04-01T00:00:00.000Z",
  "generatedAt": "2026-03-06T09:32:00.000Z",
  "incomeTotal": 2000,
  "expenseTotal": 1200,
  "balance": 800,
  "expenseByCategory": [
    {
      "category": "rent",
      "totalExpense": 800,
      "count": 1,
      "percentOfExpenses": 66.6667
    },
    {
      "category": "food",
      "totalExpense": 200,
      "count": 6,
      "percentOfExpenses": 16.6667
    },
    {
      "category": "transport",
      "totalExpense": 200,
      "count": 3,
      "percentOfExpenses": 16.6667
    }
  ]
}

```