/** @typedef {import('../../models/Transaction.js').TransactionDoc} TransactionDoc */
/** @typedef {mongoose.QueryOptions<TransactionDoc>} TransactionQueryOptions */
/** @typedef {mongoose.QueryFilter<TransactionDoc>} TransactionQuery */
/** @typedef {{success: boolean, data?: TransactionDoc[], error?: string}} GetTransactionDataResult */
import express from "express"
import mongoose from 'mongoose';
import Transaction from '../../models/Transaction.js';
/**
 * @param {express.Request} req 
 * @param {express.Response} res
 * 
 */
export async function GetTransactions(req, res) {
	console.log("GetTransactions called with query:", req.query);
	const { options, query } = buildTransactionQueryAndOptions(req.query);
	/**
	 * @type {{success: boolean, data?: TransactionDoc[], error?: string}}
	 */
	const result = { success: false };

	const { data, error } = await getTransactionData(query, options);

	if (error) {
		result.error = error;
		return res.status(500).json(result);
	}
	result.success = true;
	result.data = data;
	res.json(result);
}

/**
 * @param {TransactionQuery} query
 * @param {TransactionQueryOptions} options
 * @returns {Promise<GetTransactionDataResult>}
 */
async function getTransactionData(query, options) {
	const result = { success: false };
	try {
		const transactions = await Transaction.find(query).setOptions(options).exec();
		result.success = true;
		result.data = transactions;

	} catch (error) {
		result.error = error.message;
	}
	return result
}

// this function builds the query and options for the getTransactionData function based on the provided parameters
function buildTransactionQueryAndOptions(params) {
	const query = {};
	const options = {};
	if (params.page) {
		options.skip = (params.page - 1) * params.limit;
	}
	if (params.limit) {
		options.limit = params.limit;
	}
	// date (this is a convoluted way to do it, but it works)
	// senario A : exact date is provided
	if (params.date) {
		// we create a date range for the provided date (same day from 00:00:00 to 23:59:59)
		const startOfDay = new Date(params.date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(params.date);
		endOfDay.setHours(23, 59, 59, 999);
		query.createdAt = {};
		query.createdAt.$gte = startOfDay;
		query.createdAt.$lte = endOfDay;
	}
	// senario B : date range is provided
	else {
		// pass the dates as they are, zod has already coerced them to dates, so we can use them directly
		if (params.createdFrom) query.createdAt = { $gte: params.createdFrom };
		if (params.createdTo) query.createdAt = { ...query.createdAt, $lte: params.createdTo };
	}
	if (params.category) {
		query.category = params.category;
	}
	if (params.type === "income" || params.type === "expense") {
		query.transactionType = params.type;
	}


	
	return { query, options };
}
