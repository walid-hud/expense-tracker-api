/**
 * @typedef {import("../../controllers/transactions/get_transactions").TransactionQuery} query
 */
import { getStats } from "../../utils/index.js";




export async function GetStats(req, res) {
    const { query } = req
    const { month, year } = query
    if (month == null && year == null) {
        return res.status(400).json({ success: false, error: "month and year query parameters are required" })
    }
    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
    const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
    const result = await getStats(from, to)
    if (result.success) {
        if (result.data.length === 0) {
            return res.status(404).json({ success: false, error: "no statistics available for this query" })
        }
        res.json({ success: true, data: result.data })
    } else {
        res.status(500).json({ success: false, error: result.error })
    }
}