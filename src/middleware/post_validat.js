import { body, validationResult } from "express-validator";
import { success } from "zod";

export const validatorRoles = [
    body("title").notEmpty().withMessage("title is required"),
    body("amount")
        .notEmpty()
        .withMessage("amount is required")
        .isInt({ min: 1 })
        .withMessage("amount must be > 0"),
    body("transactionType")
        .notEmpty()
        .withMessage("transactionType is required")
        .isIn(["income", "expense"])
        .withMessage("type must be either income or expense"),
    body("category")
        .if((value, { req }) => req.body.transactionType == "expense")
        .notEmpty()
        .withMessage("category is required for expense"),
    body("date").notEmpty().withMessage("date is required")   
];

// function of validation
 export function validator(req, res, next) {
    const validation = validationResult(req);

    if (!validation.isEmpty()) {
        return res.status(400).json({ errors: validation.errors ,success:false });
    }
    next();
}

