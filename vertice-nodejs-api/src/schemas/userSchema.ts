import { z } from 'zod';

// User creation schema
export const createUserSchema = z.object({
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(50),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['ADMIN', 'CASHIER'], { errorMap: () => ({ message: 'Rol inválido' }) }),
});

// User update schema
export const updateUserSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'CASHIER']).optional(),
});

// Login schema
export const loginSchema = z.object({
    username: z.string().min(1, 'El nombre de usuario es requerido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
