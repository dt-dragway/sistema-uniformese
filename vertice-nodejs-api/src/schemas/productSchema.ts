import { z } from 'zod';

// Product validation schemas
export const productSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    description: z.string().nullable().optional(),
    price: z.number().nonnegative('El precio no puede ser negativo'),
    cost: z.number().nonnegative('El costo no puede ser negativo').nullable().optional(),
    stock: z.number().nullable().optional(),
    minStock: z.number().nonnegative('El stock mínimo no puede ser negativo').nullable().optional(),
    desiredStock: z.number().nonnegative('El stock deseado no puede ser negativo').nullable().optional(),
    offerPrice: z.number().nonnegative('El precio de oferta no puede ser negativo').nullable().optional(),
    unitType: z.enum(['UNIT', 'KG', 'LITER'], { errorMap: () => ({ message: 'Tipo de unidad inválido' }) }),
    barCode: z.string().nullable().optional(),
    tipo: z.string().nullable().optional(),
    caracteristica: z.string().nullable().optional(),
    talla: z.string().nullable().optional(),
    detalle: z.string().nullable().optional(),
    tela: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
});

export const updateProductSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

