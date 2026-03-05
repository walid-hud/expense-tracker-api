import Transaction from "../models/Transaction";
import mongoose from "mongoose";
/**
 * @param {import("../controllers/transactions/get_transactions").TransactionQuery} query
 * @param {import("../controllers/transactions/get_transactions").TransactionQueryOptions} options
 */
export async function getStats(query , options){
    /** @type {mongoose.PipelineStage[]} */
    const pipeline = [
        {$match:query},
    ]
    const stats = await Transaction.aggregate([{}])
}

