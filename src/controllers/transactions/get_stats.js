import Transaction from "../models/Transaction";
import mongoose from "mongoose";
/**
 * @typedef {import("../../controllers/transactions/get_transactions").TransactionQuery} query
 * @param {import("../../controllers/transactions/get_transactions").TransactionQueryOptions} options
 */
import { getStats } from "../../utils";
/**
 * @type {query}
 */
const statsQuery = {}



export async function GetStats(req,res){
    const {params} = req

    if(params.category){
        statsQuery.category = params.category 
    }
    if(params.month && params.year){
        statsQuery.createdAt = {
            $gte: new Date(params.year, params.month - 1, 1),
            $lte: new Date(params.year, params.month, 0, 23, 59, 59, 999)
        }
    }
    if(params.year && !params.month){
        statsQuery.createdAt = {
            $gte: new Date(params.year, 0, 1),
            $lte: new Date(params.year, 11, 31, 23, 59, 59, 999)
        }
    }
    const result = await getStats(statsQuery , {lean:true})
    if(result.success){
        res.json({success:true , data:result.data})
    }else{
        res.status(500).json({success:false , error:result.error})
    }
}