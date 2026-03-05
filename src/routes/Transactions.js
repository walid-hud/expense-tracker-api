import express from "express";
import { GetStats } from "../controllers/transactions/get_stats.js";
import { GetTransactions } from "../controllers/transactions/get_transactions.js";
import { PostTransaction } from "../controllers/transactions/post_transactions.js";
import z from "zod";
import { zodValidate } from "../middleware/zod_validate.js";
import { validatorRoles, validator } from "../middleware/post_validat.js";
const router = express.Router();

export const GetTransactionsParamsSchema = z
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
        },
    );

router.get("/", zodValidate(GetTransactionsParamsSchema), GetTransactions);
router.post("/", validatorRoles, validator, PostTransaction);
router.get("/stats", GetStats);

export default router;
