import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";
/**
 * @param {Date} from
 * @param {Date} to
 */
export async function getStats(from, to) {
    /** @type {mongoose.PipelineStage[]} */

    const pipeline = [
        // 1) your existing month-level grouping (produces one doc for the month)
        { $match: { date: { $gte: from, $lt: to } } },
        {
            $group: {
                _id: { $dateTrunc: { date: "$date", unit: "month" } },
                totalExpenseByCategory: {
                    $push: {
                        $cond: [
                            { $eq: ["$transactionType", "expense"] },
                            { category: "$category", amount: "$amount" },
                            "$$REMOVE"
                        ]
                    }
                },
                totalIncome: {
                    $sum: { $cond: [{ $eq: ["$transactionType", "income"] }, "$amount", 0] }
                },
                totalExpenses: {
                    $sum: { $cond: [{ $eq: ["$transactionType", "expense"] }, "$amount", 0] }
                }
            }
        },

        // 2) unwind the per-item array into documents (preserve months with no expenses)
        { $unwind: { path: "$totalExpenseByCategory", preserveNullAndEmptyArrays: true } },

        // 3) group by category to sum amounts (no month key needed because single-month doc)
        {
            $group: {
                _id: "$totalExpenseByCategory.category",
                totalExpense: { $sum: "$totalExpenseByCategory.amount" },
                // carry forward month totals from the parent doc
                totalExpenses: { $first: "$totalExpenses" },
                totalIncome: { $first: "$totalIncome" },
                monthId: { $first: "$_id" }
            }
        },

        // 4) assemble categories array and keep totals (if category is null, you can filter it out)
        {
            $group: {
                _id: "$monthId",
                expenseByCategory: {
                    $push: {
                        category: "$_id",
                        totalExpense: "$totalExpense"
                    }
                },
                totalExpenses: { $first: "$totalExpenses" },
                totalIncome: { $first: "$totalIncome" }
            }
        },

        // 5) final projection: compute percentOfExpenses per category and final shape
        {
            $project: {
                _id: 0,
                year: { $year: "$_id" },
                month: { $month: "$_id" },
                totalIncome: "$totalIncome",
                totalExpenses: "$totalExpenses",
                balance: { $subtract: ["$totalIncome", "$totalExpenses"] },
                expenseByCategory: {
                    $map: {
                        input: { $ifNull: ["$expenseByCategory", []] },
                        as: "c",
                        in: {
                            category: "$$c.category",
                            totalExpense: "$$c.totalExpense",
                            percentOfExpenses: {
                                $cond: [
                                    { $gt: ["$totalExpenses", 0] },
                                    { $round: [{ $multiply: [{ $divide: ["$$c.totalExpense", "$totalExpenses"] }, 100] }, 2] },
                                    0
                                ]
                            }
                        }
                    }
                }
            }
        }
    ];


    const stats = await Transaction.aggregate(pipeline).exec()
    return { success: true, data: stats }
}

