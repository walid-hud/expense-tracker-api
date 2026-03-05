import { body } from "express-validator";
import mongoose from "mongoose";
import Transaction from "../../models/Transaction.js";
import { success } from "zod";

// export function PostTransaction(req,res){

// }

export const PostTransaction = async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        const savedTransaction = await transaction.save();
        res.status(201).json({
            success: true,
            data: {
                transaction: savedTransaction,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: "transaction was to creat",
        });
    }
};
