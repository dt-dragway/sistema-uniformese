import { z } from 'zod';

// Sale item schema
const saleItemSchema = z.object({
    productId: z.number().int().positive('ID de producto inválido'),
    quantity: z.number().positive('La cantidad debe ser positiva'),
    price: z.number().positive('El precio debe ser positivo'),
});

// Payment schema
const paymentSchema = z.object({
    method: z.string().min(1, 'El método de pago es requerido'),
    amount: z.number().positive('El monto debe ser positivo'),
    reference: z.string().optional(),
});

// Recharge schema
const rechargeSchema = z.object({
    serviceId: z.number().int().positive(),
    serviceName: z.string(),
    phoneNumber: z.string().min(1),
    amountBs: z.number().positive(),
    commissionPercent: z.number().nonnegative(),
    commissionBs: z.number().nonnegative(),
    totalChargeBs: z.number().positive(),
});

// Cash advance schema
const cashAdvanceSchema = z.object({
    amountToGive: z.number().positive(),
    commissionPercent: z.number().nonnegative(),
    commissionBs: z.number().nonnegative(),
    totalChargeBs: z.number().positive(),
    paymentMethod: z.string(),
});

// Sale creation schema
export const createSaleSchema = z.object({
    items: z.array(saleItemSchema).min(1, 'Debe haber al menos un item'),
    payments: z.array(paymentSchema).min(1, 'Debe haber al menos un método de pago'),
    totalUsd: z.number().positive('El total debe ser positivo'),
    totalBs: z.number().positive('El total debe ser positivo'),
    customerId: z.number().int().positive().optional(),
    cashRegisterSessionId: z.number().int().positive('Sesión de caja inválida'),
    discount: z.number().nonnegative('El descuento no puede ser negativo').optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().nonnegative().optional(),
    pendingRecharges: z.array(rechargeSchema).optional(),
    pendingCashAdvances: z.array(cashAdvanceSchema).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
