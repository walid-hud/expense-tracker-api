/**
 * @typedef {import("../../controllers/transactions/get_transactions").TransactionQuery} query
 */
import { getStats } from "../../utils/index.js";




export async function GetStats(req, res) {
    /**
    * @type {query}
    */
    const statsQuery = {}
    const { query } = req
    const { month, year } = query
    if (month && year) {
        const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
        const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)) 
        statsQuery.date = {
            $gte: from,
            $lt: to
        }
    }

    const result = await getStats(statsQuery, { lean: true })
    if (result.success) {
        res.json({ success: true, data: result.data })
    } else {
        res.status(500).json({ success: false, error: result.error })
    }
}