import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware para validar datos con Zod
 * @param schema - Schema de Zod para validar
 * @param source - Fuente de datos a validar: 'body', 'params', 'query'
 */
export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataToValidate = req[source];

            // Validar datos con el schema
            const validatedData = schema.parse(dataToValidate);

            // Reemplazar los datos originales con los validados y transformados
            req[source] = validatedData;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Formatear errores de validación
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                logger.warn('Validation error', {
                    path: req.path,
                    method: req.method,
                    errors: formattedErrors,
                });

                return res.status(400).json({
                    error: 'Datos de entrada inválidos',
                    details: formattedErrors,
                });
            }

            // Error inesperado
            logger.error('Unexpected validation error', { error });
            return res.status(500).json({
                error: 'Error interno del servidor',
            });
        }
    };
};
