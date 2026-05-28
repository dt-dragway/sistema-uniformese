"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = void 0;
const zod_1 = require("zod");
// Sale item schema
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive('ID de producto inválido'),
    quantity: zod_1.z.number().positive('La cantidad debe ser positiva'),
    price: zod_1.z.number().positive('El precio debe ser positivo'),
});
// Payment schema
const paymentSchema = zod_1.z.object({
    method: zod_1.z.string().min(1, 'El método de pago es requerido'),
    amount: zod_1.z.number().positive('El monto debe ser positivo'),
    reference: zod_1.z.string().optional(),
});
// Recharge schema
const rechargeSchema = zod_1.z.object({
    serviceId: zod_1.z.number().int().positive(),
    serviceName: zod_1.z.string(),
    phoneNumber: zod_1.z.string().min(1),
    amountBs: zod_1.z.number().positive(),
    commissionPercent: zod_1.z.number().nonnegative(),
    commissionBs: zod_1.z.number().nonnegative(),
    totalChargeBs: zod_1.z.number().positive(),
});
// Cash advance schema
const cashAdvanceSchema = zod_1.z.object({
    amountToGive: zod_1.z.number().positive(),
    commissionPercent: zod_1.z.number().nonnegative(),
    commissionBs: zod_1.z.number().nonnegative(),
    totalChargeBs: zod_1.z.number().positive(),
    paymentMethod: zod_1.z.string(),
});
// Sale creation schema
exports.createSaleSchema = zod_1.z.object({
    items: zod_1.z.array(saleItemSchema).min(1, 'Debe haber al menos un item'),
    payments: zod_1.z.array(paymentSchema).min(1, 'Debe haber al menos un método de pago'),
    totalUsd: zod_1.z.number().positive('El total debe ser positivo'),
    totalBs: zod_1.z.number().positive('El total debe ser positivo'),
    customerId: zod_1.z.number().int().positive().optional(),
    cashRegisterSessionId: zod_1.z.number().int().positive('Sesión de caja inválida'),
    discount: zod_1.z.number().nonnegative('El descuento no puede ser negativo').optional(),
    discountType: zod_1.z.enum(['percentage', 'fixed']).optional(),
    discountValue: zod_1.z.number().nonnegative().optional(),
    pendingRecharges: zod_1.z.array(rechargeSchema).optional(),
    pendingCashAdvances: zod_1.z.array(cashAdvanceSchema).optional(),
});
