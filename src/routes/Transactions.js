import express from "express";
import { GetStats } from "../controllers/transactions/get_stats.js";
import { GetTransactions } from "../controllers/transactions/get_transactions.js";
import { PostTransaction } from "../controllers/transactions/post_transactions.js";
import z from "zod";
import { zodValidate } from "../middleware/zod_validate.js";
import { validatorRoles, validator } from "../middleware/post_validat.js";
import { validatExpense, validatorEx } from "../middleware/validat_Expense.js";
const router = express.Router();

export const GetTransactionsSchema = z
  .object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    date: z.coerce.date().optional(),
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
    category: z.string().optional(),
    type: z.enum(["income", "expense"]).optional(),
    /* example request query: 
        transactions?page=1&limit=10&date=2024-01-01&createdFrom=2024-01-01&createdTo=2024-12-31&category=food&type=expense
        */
  })
  /* 
    we want to make sure that the user doesn't specify 
    both date and createdFrom/createdTo, because that would be ambiguous, 
    so we add a refinement to the schema to check for that
    */
  .refine(
    (data) => {
      if (data.date && (data.createdFrom || data.createdTo)) {
        return false;
      }
      return true;
    },
    {
      message: "either specify date or createdFrom/createdTo, not both",
      path: ["date", "createdFrom", "createdTo"],
    },
  );

router.get("/", zodValidate(GetTransactionsSchema), GetTransactions);
router.post(
  "/",
  validatorRoles,
  validator,
  validatExpense,
  validatorEx,
  PostTransaction,
);

const getTransactionsStatsSchema = z
  .object({
    // Keep empty query values (month=) from becoming 0 via coercion.
    month: z.preprocess(
        // we have to do this because zod converts empty strings to 0 when using z.coerce.number(), 
        // so we have to convert them to undefined first, so they can be treated as optional
      (value) => (value === "" || value == null ? undefined : value),
      z.coerce.number().int().min(1).max(12),
    ),
    year: z.preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z.coerce.number().int().min(1900).max(new Date().getFullYear()),
    ),
  })
  .strict() // to disallow extra query parameters
  // and finally we want to make sure that if the user specifies month, they also specify year 
  // because it doesn't make sense to specify one without the other 
  .refine(
    (data) =>
      (data.month == null && data.year == null) ||
      (data.month != null && data.year != null),
    {
      message: "month and year must be provided together",
      path: ["month", "year"],
    },
  );
router.get("/stats", zodValidate(getTransactionsStatsSchema), GetStats);

export default router;
