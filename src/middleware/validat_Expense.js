import { body, validationResult } from "express-validator";
import Transaction from "../models/Transaction.js";
import { success } from "zod";
export const validatExpense = [
    body("amount").custom(async (value, { req }) => {
        if (req.body.transactionType === "expense") {
            const incomes = await Transaction.aggregate([
                { $match: { transactionType: "income" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);

            const totalIncome = incomes[0]?.total || 0;


            if (value > totalIncome) {
                throw new Error("Expense exceeds available balance");
            }
        }

        return true;
    }),
];

export function validatorEx(req, res, next) {
    const validation = validationResult(req);

    if (!validation.isEmpty()) {
        return res.status(400).json({ errors: validation.errors,success:false });
    }
    next();
}
