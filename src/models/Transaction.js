import mongoose from "mongoose";
import mongoos from "mongoose";
import {body,validationResult} from "express-validator";

const TransactionSchema = mongoos.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            min: [0, "error"],
            required: true,
        },
        transactionType: {
            type: String,
            enum: ["expense", "income"],
            required: true,
        },
        category: {
            type: String,
            required: function () {
                return this.transactionType === "expense";
            },
        },
        date: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true },
);

/**
 * @type {mongoos.Model} Transactions
 */
const Transaction = mongoos.model("Transaction", TransactionSchema);
export default Transaction;

const validatorRoles =[
    
]