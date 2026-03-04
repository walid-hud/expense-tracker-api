import express from "express";
import { GetStats } from "../controllers/transactions/getStart_transactions.js";
import { GetTransactions } from "../controllers/transactions/get_transactions.js";
import { PostTransaction } from "../controllers/transactions/post_transactions.js";
const router = express.Router();

router.get("/", GetTransactions);
router.post("/", PostTransaction);
router.get("/stats", GetStats);

export default router;
