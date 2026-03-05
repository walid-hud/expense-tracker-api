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
                success: false,
                errors: validationResult.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                }))
            });
        }
        /*
        we have to do this because req.query is an immutabe getter that 
        returns a new object every time, so we can't just assign the
        validated data to it, we have to redefine the property with the validated data
        */
        Object.defineProperty(req, 'query', {
            value: validationResult.data,
            configurable: true,
            enumerable: true,
        });
        next();
    }
}
