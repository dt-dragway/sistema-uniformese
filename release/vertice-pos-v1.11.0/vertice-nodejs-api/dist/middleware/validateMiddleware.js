"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Middleware para validar datos con Zod
 * @param schema - Schema de Zod para validar
 * @param source - Fuente de datos a validar: 'body', 'params', 'query'
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const dataToValidate = req[source];
            // Validar datos con el schema
            const validatedData = schema.parse(dataToValidate);
            // Reemplazar los datos originales con los validados y transformados
            req[source] = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                // Formatear errores de validación
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                logger_1.logger.warn('Validation error', {
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
            logger_1.logger.error('Unexpected validation error', { error });
            return res.status(500).json({
                error: 'Error interno del servidor',
            });
        }
    };
};
exports.validate = validate;
