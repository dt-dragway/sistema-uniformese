import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  cedula: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  category: z.string().optional().nullable(), // e.g. INDUSTRIAL, SALUD, CORPORATIVO
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  otherContact: z.string().optional().nullable(),
  creditLimit: z.number().nonnegative('El límite de crédito no puede ser negativo').optional(),
  currentCredit: z.number().optional(),
});

export const updateCustomerSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
