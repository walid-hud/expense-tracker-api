# Validation and Error Centralization Plan

## Objective
Centralize API error handling and response shape while minimizing impact on existing teammate code that uses `express-validator`.

## Constraint
Prefer changing your code paths first and keep teammate validation logic (`validatorRoles`, `validatExpense`, `validator`, `validatorEx`) as-is when possible.

## Current State (Observed)
- Two validation systems are active.
- `zod` path uses `src/middleware/zod_validate.js` and returns `{ success: false, errors: [...] }`.
- `express-validator` paths use `src/middleware/post_validat.js` and `src/middleware/validat_Expense.js` and return `{ success: false, errors: validation.errors }`.
- Controller error payloads are inconsistent (`error` string vs `errors` array, and mixed statuses/messages).
- App-level `404` in `server.js` returns `{ error: "not found" }` without `success`.
- No global Express error middleware currently normalizes thrown/runtime errors.

## Target Response Contract
Use one response contract for all endpoints:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "request validation failed",
    "details": [
      { "field": "month", "message": "month must be between 1 and 12" }
    ]
  }
}
```

Success example:

```json
{
  "success": true,
  "data": {}
}
```

Notes:
- Keep `success` and `data` for successful responses.
- Standardize all failures to `error: { code, message, details? }`.
- `details` should only be present for validation-style errors.

## Migration Strategy (Minimize Teammate Changes)

### Phase 1: Add shared response helpers (your change)
Create `src/utils/http_response.js` with helpers:
- `sendSuccess(res, data, status = 200)`
- `sendError(res, status, code, message, details)`
- `sendValidationError(res, details)`

Benefit:
- Controllers can stop building custom payloads by hand.
- Teammate validator logic can stay unchanged initially.

### Phase 2: Normalize validation output with adapters (your change)
Create `src/middleware/validation_error_adapter.js`:
- `normalizeZodIssues(issues)` -> `[{ field, message, code }]`
- `normalizeExpressValidatorErrors(errors)` -> `[{ field, message, code }]`

Then update only wrappers/middleware entry points:
- `src/middleware/zod_validate.js`: call `sendValidationError(...)` using normalized issues.
- Add one new middleware for post routes after existing validators:
  - `handleExpressValidationResult` reads `validationResult(req)` and emits `sendValidationError(...)`.

Important:
- Keep teammate rule definitions (`validatorRoles`, `validatExpense`) untouched.
- If needed, keep `validator` and `validatorEx` for backward compatibility and stop using them in routes you own.

### Phase 3: Standardize controllers incrementally (your change)
Update your controllers first:
- `src/controllers/transactions/get_transactions.js`
- `src/controllers/transactions/get_stats.js`
- `src/controllers/transactions/post_transactions.js`

Replace inline `res.status(...).json(...)` with shared helpers.

Goal:
- Same error contract for `400`, `404`, `500`.
- Keep behavior/status codes, only normalize shape.

### Phase 4: Add global not-found and error middleware (your change)
In `server.js`:
- Replace current 404 handler with `sendError(res, 404, "NOT_FOUND", "route not found")`.
- Add final error middleware:
  - Converts uncaught exceptions to `500` with stable shape.
  - Logs internal error safely.

## Suggested Route Wiring (Preserve teammate validator code)
Current:
- `router.post("/", validatorRoles, validator, validatExpense, validatorEx, PostTransaction);`

Proposed transition:
- Keep `validatorRoles` and `validatExpense`.
- Replace `validator` and `validatorEx` with one adapter middleware you own:

```js
router.post(
  "/",
  validatorRoles,
  validatExpense,
  handleExpressValidationResult,
  PostTransaction,
);
```

This keeps your teammate's validation rule arrays unchanged and centralizes output in one place.

## Rollout Plan
1. Add helper and adapter files.
2. Switch `zod_validate.js` to helper output.
3. Introduce `handleExpressValidationResult` and update only `POST /transactions` chain.
4. Migrate controllers to helper methods.
5. Add server-level `404` and error middleware.
6. Run endpoint-level smoke tests.

## Smoke Test Checklist
- `GET /transactions` invalid query -> `400` unified validation shape.
- `GET /transactions/stats` invalid month/year -> `400` unified validation shape.
- `POST /transactions` missing title/amount -> `400` unified validation shape.
- `POST /transactions` expense exceeds balance -> `400` unified validation shape.
- Unknown route -> `404` unified error shape.
- Forced server failure -> `500` unified error shape.

## Risks and Mitigations
- Risk: Existing consumers may depend on old `errors` array format.
- Mitigation: Temporary compatibility mode in `sendValidationError`:
  - return both `error.details` and legacy `errors` during transition window.

- Risk: Duplicate validation handling if old and new middlewares both run.
- Mitigation: Route-by-route migration; remove old result middlewares only where adapter is enabled.

## Ownership Split
- Your changes:
  - shared response utility
  - adapters
  - zod middleware output
  - your controllers and route wiring
  - server global handlers
- Teammate code preserved:
  - existing `express-validator` rule definitions and custom validation logic

## Definition of Done
- Every endpoint returns consistent success/error envelopes.
- Validation details format is identical across `zod` and `express-validator`.
- No direct ad-hoc `res.status(...).json(...)` in migrated controllers.
- Existing validation business rules still pass unchanged.
