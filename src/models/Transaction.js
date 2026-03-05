// @ts-check
import mongoose from "mongoose";
const TransactionSchema = new mongoose.Schema(
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
 * @typedef {mongoose.InferSchemaType<typeof TransactionSchema>} TransactionDoc
 */

/** @type {mongoose.Model<TransactionDoc>} */
const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;

const validatorRoles = [];
