"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
console.log('AuthMiddleware JWT_SECRET:', JWT_SECRET);
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: decoded.userId, role: decoded.role }; // Añade el usuario y rol a la solicitud
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};
exports.authMiddleware = authMiddleware;
