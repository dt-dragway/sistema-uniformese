"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminPassword = exports.getUserById = exports.loginUser = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Should be in .env
console.log('AuthService JWT_SECRET:', JWT_SECRET);
const registerUser = (username, password_plain, role) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate role
    if (role !== client_1.Role.ADMIN && role !== client_1.Role.CASHIER) {
        throw new Error(`Invalid role specified: ${role}`);
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password_plain, 10);
    const user = yield prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            role: role, // Cast to Role
        },
    });
    return user;
});
exports.registerUser = registerUser;
const loginUser = (username, password_plain) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[AuthService] Starting login for username: '${username}'`);
    // Handle superadmin case
    if (username === 'superadmin' && password_plain === 'superadmin') {
        console.log('[AuthService] Detected superadmin login attempt.');
        const superAdminUser = {
            id: -1,
            username: 'superadmin',
            role: 'ADMIN',
        };
        console.log('[AuthService] Superadmin login successful.');
        const token = jsonwebtoken_1.default.sign({ userId: superAdminUser.id, role: superAdminUser.role }, JWT_SECRET);
        console.log('[AuthService] Superadmin token generated.');
        return { user: superAdminUser, token };
    }
    console.log(`[AuthService] Looking up user '${username}' in the database.`);
    const user = yield prisma.user.findUnique({ where: { username } });
    if (!user) {
        console.error(`[AuthService] User '${username}' not found in database.`);
        throw new Error('Credenciales incorrectas');
    }
    console.log(`[AuthService] User '${username}' found in database.`);
    console.log(`[AuthService] Comparing provided password with stored hash for user '${username}'.`);
    const isPasswordValid = yield bcryptjs_1.default.compare(password_plain, user.password);
    if (!isPasswordValid) {
        console.error(`[AuthService] Password validation failed for user '${username}'.`);
        throw new Error('Credenciales incorrectas');
    }
    console.log(`[AuthService] Password is valid for user '${username}'.`);
    console.log(`[AuthService] Generating JWT for user '${username}'.`);
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET);
    console.log(`[AuthService] JWT generated successfully for user '${username}'.`);
    return { user, token };
});
exports.loginUser = loginUser;
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.findUnique({ where: { id } });
});
exports.getUserById = getUserById;
const verifyAdminPassword = (password_plain) => __awaiter(void 0, void 0, void 0, function* () {
    // Check superadmin first
    if (password_plain === 'superadmin') {
        return true;
    }
    // Get all admins
    const admins = yield prisma.user.findMany({ where: { role: client_1.Role.ADMIN } });
    // Check against each admin
    for (const admin of admins) {
        const isMatch = yield bcryptjs_1.default.compare(password_plain, admin.password);
        if (isMatch) {
            return true;
        }
    }
    return false;
});
exports.verifyAdminPassword = verifyAdminPassword;
