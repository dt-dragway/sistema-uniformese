import { z } from 'zod';

// Product validation schemas
export const productSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    description: z.string().optional(),
    price: z.number().positive('El precio debe ser positivo'),
    cost: z.number().nonnegative('El costo no puede ser negativo').optional(),
    stock: z.number().nonnegative('El stock no puede ser negativo'),
    minStock: z.number().nonnegative('El stock mínimo no puede ser negativo').optional(),
    desiredStock: z.number().nonnegative('El stock deseado no puede ser negativo').optional(),
    offerPrice: z.number().nonnegative('El precio de oferta no puede ser negativo').optional(),
    unitType: z.enum(['UNIT', 'KG', 'LITER'], { errorMap: () => ({ message: 'Tipo de unidad inválido' }) }),
    barCode: z.string().optional(),
});

export const updateProductSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

