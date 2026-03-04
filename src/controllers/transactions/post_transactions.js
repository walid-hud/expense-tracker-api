import { body } from "express-validator";
import mongoose from "mongoose";
import Transaction from "../../models/Transaction.js";

// export function PostTransaction(req,res){

// }


export const PostTransaction = async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    const savedTransaction = await transaction.save();
    res.status(201).json({
      message: "Transaction ajoutée avec succès",
      transaction: savedTransaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout de la transaction" });
  }
};