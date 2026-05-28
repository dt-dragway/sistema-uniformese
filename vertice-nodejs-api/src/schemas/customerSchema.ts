import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    cedula: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    creditLimit: z.number().nonnegative('El límite de crédito no puede ser negativo').optional(),
    currentCredit: z.number().nonnegative('El crédito actual no puede ser negativo').optional(),
});

export const updateCustomerSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
