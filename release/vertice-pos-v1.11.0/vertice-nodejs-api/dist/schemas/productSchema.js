"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.productSchema = void 0;
const zod_1 = require("zod");
// Product validation schemas
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'El nombre es requerido').max(255),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive('El precio debe ser positivo'),
    cost: zod_1.z.number().nonnegative('El costo no puede ser negativo').optional(),
    stock: zod_1.z.number().nonnegative('El stock no puede ser negativo'),
    minStock: zod_1.z.number().nonnegative('El stock mínimo no puede ser negativo').optional(),
    desiredStock: zod_1.z.number().nonnegative('El stock deseado no puede ser negativo').optional(),
    offerPrice: zod_1.z.number().nonnegative('El precio de oferta no puede ser negativo').optional(),
    unitType: zod_1.z.enum(['UNIT', 'KG', 'LITER'], { errorMap: () => ({ message: 'Tipo de unidad inválido' }) }),
    barCode: zod_1.z.string().optional(),
});
exports.updateProductSchema = exports.productSchema.partial();
