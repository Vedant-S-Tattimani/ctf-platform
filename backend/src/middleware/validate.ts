import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from './errorHandler.js';

function makeValidator(source: 'body' | 'params' | 'query') {
  return (schema: ZodTypeAny) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        next(new HttpError(400, 'Validation failed', result.error.flatten()));
        return;
      }
      // req.query is a getter-only property in Express 4; replace it explicitly.
      Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
      next();
    };
}

export const validateBody = makeValidator('body');
export const validateParams = makeValidator('params');
export const validateQuery = makeValidator('query');
