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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = exports.getProfile = exports.login = exports.register = void 0;
const AuthService_1 = require("../services/AuthService");
const UserService_1 = require("../services/UserService");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, role } = req.body;
        const user = yield (0, AuthService_1.registerUser)(username, password, role || 'user');
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, username: user.username, role: user.role },
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        }
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[AuthController] Attempting to log in...');
    try {
        const { username, password } = req.body;
        console.log(`[AuthController] Login request for username: ${username}`);
        if (!username || !password) {
            console.error('[AuthController] Username or password not provided.');
            return res.status(400).json({ message: 'Username and password are required' });
        }
        const { user, token } = yield (0, AuthService_1.loginUser)(username, password);
        console.log(`[AuthController] Login successful for user: ${user.username}`);
        res
            .status(200)
            .json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role }, token });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`[AuthController] Error during login: ${error.message}`);
            res.status(400).json({ message: error.message });
        }
        else {
            console.error(`[AuthController] An unknown error occurred:`, error);
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
});
exports.login = login;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const user = yield (0, UserService_1.getUserById)(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
    }
});
exports.getProfile = getProfile;
const verifyAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        const isValid = yield (0, AuthService_1.verifyAdminPassword)(password);
        if (isValid) {
            res.status(200).json({ success: true, message: 'Admin verified' });
        }
        else {
            res.status(401).json({ success: false, message: 'Invalid admin password' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error verifying admin password' });
    }
});
exports.verifyAdmin = verifyAdmin;
