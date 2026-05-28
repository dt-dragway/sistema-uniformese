"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.getUserRoleFromRequest = exports.getUserIdFromRequest = void 0;
const getUserIdFromRequest = (req) => {
    const user = req.user;
    if (user && user.id) {
        return user.id;
    }
    return null;
};
exports.getUserIdFromRequest = getUserIdFromRequest;
const getUserRoleFromRequest = (req) => {
    const user = req.user;
    if (user && user.role) {
        return user.role;
    }
    return null;
};
exports.getUserRoleFromRequest = getUserRoleFromRequest;
const isAdmin = (req) => {
    const role = (0, exports.getUserRoleFromRequest)(req);
    return role === 'ADMIN';
};
exports.isAdmin = isAdmin;
