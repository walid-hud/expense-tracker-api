import express from "express"
import { GetStats, GetTransactions, PostTransaction } from "../controllers/Transactions.js"
const router = express.Router()



router.get("/", GetTransactions)
router.post("/", PostTransaction)
router.get("/stats", GetStats)


export default router