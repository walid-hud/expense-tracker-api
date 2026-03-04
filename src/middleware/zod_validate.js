// @ts-check
import { z } from 'zod';

/** 
 * @param {z.ZodSchema} schema 
 * @returns {import('express').RequestHandler} 
*/
export function zodValidate(schema) {
    return (req, res, next) => {
        const validationResult = schema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                error: 'invalid request',
                details: z.treeifyError(validationResult.error),
            });
        }
        req.query = validationResult.data; // Use the parsed data
        next();
    }
}
