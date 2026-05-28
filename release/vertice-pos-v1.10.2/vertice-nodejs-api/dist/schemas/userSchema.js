"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
// User creation schema
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(50),
    password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: zod_1.z.enum(['ADMIN', 'CASHIER'], { errorMap: () => ({ message: 'Rol inválido' }) }),
});
// User update schema
exports.updateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50).optional(),
    password: zod_1.z.string().min(6).optional(),
    role: zod_1.z.enum(['ADMIN', 'CASHIER']).optional(),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'El nombre de usuario es requerido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida'),
});
