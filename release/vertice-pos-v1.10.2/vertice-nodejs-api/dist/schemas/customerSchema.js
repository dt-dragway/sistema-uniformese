"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerSchema = exports.customerSchema = void 0;
const zod_1 = require("zod");
// Customer schema
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'El nombre es requerido').max(255),
    cedula: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    creditLimit: zod_1.z.number().nonnegative('El límite de crédito no puede ser negativo').optional(),
    currentCredit: zod_1.z.number().nonnegative('El crédito actual no puede ser negativo').optional(),
});
exports.updateCustomerSchema = exports.customerSchema.partial();
