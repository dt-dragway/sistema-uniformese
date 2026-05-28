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
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.findMany({
        where: {
            username: {
                not: 'superadmin',
            },
        },
        select: { id: true, username: true, role: true },
    });
});
exports.getAllUsers = getAllUsers;
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.findUnique({ where: { id }, select: { id: true, username: true, role: true } });
});
exports.getUserById = getUserById;
const createUser = (username, password_plain, role) => __awaiter(void 0, void 0, void 0, function* () {
    if (role !== client_1.Role.ADMIN && role !== client_1.Role.CASHIER) {
        throw new Error(`Invalid role specified: ${role}`);
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password_plain, 10);
    return prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            role: role,
        },
        select: { id: true, username: true, role: true },
    });
});
exports.createUser = createUser;
const updateUser = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = {};
    if (data.username) {
        updateData.username = data.username;
    }
    if (data.password) {
        updateData.password = yield bcryptjs_1.default.hash(data.password, 10);
    }
    if (data.role) {
        if (data.role !== client_1.Role.ADMIN && data.role !== client_1.Role.CASHIER) {
            throw new Error(`Invalid role specified: ${data.role}`);
        }
        updateData.role = data.role;
    }
    return prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, username: true, role: true },
    });
});
exports.updateUser = updateUser;
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.delete({ where: { id }, select: { id: true, username: true, role: true } });
});
exports.deleteUser = deleteUser;
