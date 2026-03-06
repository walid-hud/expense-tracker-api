import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";
/**
 * @param {import("../controllers/transactions/get_transactions").TransactionQuery} query
 * @param {import("../controllers/transactions/get_transactions").TransactionQueryOptions} options
 */
export async function getStats(query , options){
    /** @type {mongoose.PipelineStage[]} */
    const pipeline = [
      { $match: query },

      // keep only needed fields
      { $project: { amount: 1, transactionType: 1, category: 1 } },

      // compute three parallel summaries
      { $facet: {
          totalsByType: [
            { $group: {
                _id: "$transactionType",
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }},
            { $project: { transactionType: "$_id", total: 1, count: 1, _id: 0 } }
          ],
          // single doc with income and expense sums
          balanceCalc: [
            { $group: {
                _id: null,
                income: {
                  $sum: { $cond: [{ $eq: ["$transactionType", "income"] }, "$amount", 0] }
                },
                expense: {
                  $sum: { $cond: [{ $eq: ["$transactionType", "expense"] }, "$amount", 0] }
                }
            }},
            { $project: { _id: 0, income: 1, expense: 1, balance: { $subtract: ["$income", "$expense"] } } }
          ],
          // expense totals per category
          expenseByCategory: [
            { $match: { transactionType: "expense" } },
            { $group: { _id: "$category", totalExpense: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { totalExpense: -1 } },
            { $project: { category: "$_id", totalExpense: 1, count: 1, _id: 0 } }
          ]
      }},

      // reshape and compute percent per category safely (avoid divide-by-zero)
      { $addFields: {
          balanceObj: { $arrayElemAt: ["$balanceCalc", 0] },
          totalsByType: "$totalsByType",
          expenseByCategory: "$expenseByCategory"
      }},

      // extract numeric totals for convenience
      { $addFields: {
          incomeTotal: { $ifNull: ["$balanceObj.income", 0] },
          expenseTotal: { $ifNull: ["$balanceObj.expense", 0] },
          balance: { $ifNull: ["$balanceObj.balance", { $subtract: [{ $ifNull: ["$balanceObj.income", 0] }, { $ifNull: ["$balanceObj.expense", 0] }] }] }
      }},

      // add percentOfExpenses to each category, rounded to 4 decimals
      { $project: {
          totalsByType: 1,
          incomeTotal: 1,
          expenseTotal: 1,
          balance: 1,
          expenseByCategory: {
            $map: {
              input: "$expenseByCategory",
              as: "c",
              in: {
                category: "$$c.category",
                totalExpense: "$$c.totalExpense",
                count: "$$c.count",
                percentOfExpenses: {
                  $cond: [
                    { $gt: ["$expenseTotal", 0] },
                    { $round: [
                        { $multiply: [
                          { $divide: ["$$c.totalExpense", "$expenseTotal"] },
                          100
                        ] },
                        4
                      ]
                    },
                    0
                  ]
                }
              }
            }
          }
      }}
    ];
    console.log("stats query:", JSON.stringify(query, null, 2))
    const testPipeline = [
      { $match: query }
    ]
    const stats = await Transaction.aggregate(testPipeline).exec()
    // console.log("computed stats:", JSON.stringify(stats, null, 2))
    if(stats.length === 0) return {success:false,error:"no statistics available for this query"}
    return {success:true, data:stats}
}

