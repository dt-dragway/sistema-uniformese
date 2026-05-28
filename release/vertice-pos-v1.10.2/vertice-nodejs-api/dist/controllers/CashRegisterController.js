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
exports.processCorteZByAdmin = exports.processCorteZ = exports.getCorteXByAdmin = exports.getCorteX = exports.advance = exports.getAllSessions = exports.getAllCashMovements = exports.getActiveSession = exports.getClosingPreviewByAdmin = exports.getClosingPreview = exports.getActiveSessions = exports.closeByAdmin = exports.close = exports.open = void 0;
const CashRegisterService_1 = require("../services/CashRegisterService");
const utils_1 = require("../utils/utils");
const cashRegisterService = new CashRegisterService_1.CashRegisterService();
const open = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { openingAmountUsd, openingAmountBs } = req.body;
        if (typeof openingAmountUsd !== 'number' || typeof openingAmountBs !== 'number') {
            return res.status(400).json({ message: 'Los montos de apertura (USD y Bs) son requeridos y deben ser números.' });
        }
        const session = yield cashRegisterService.openSession(userId, openingAmountUsd, openingAmountBs);
        res.status(201).json(session);
    }
    catch (error) {
        if (error.message.includes('activa')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al abrir la caja', error: error.message });
    }
});
exports.open = open;
const close = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { closingAmountUsd, closingAmountBs } = req.body;
        if (typeof closingAmountUsd !== 'number' || typeof closingAmountBs !== 'number') {
            return res.status(400).json({ message: 'Los montos de cierre (USD y Bs) son requeridos y deben ser números.' });
        }
        const session = yield cashRegisterService.closeSession(userId, closingAmountUsd, closingAmountBs);
        res.status(200).json(session);
    }
    catch (error) {
        console.error('Error closing session:', error); // Debug log
        if (error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al cerrar la caja', error: error.message, stack: error.stack });
    }
});
exports.close = close;
// Nuevo: Admin puede cerrar la caja de cualquier cajero
const closeByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminRequest = req;
        if (!(0, utils_1.isAdmin)(adminRequest)) {
            return res.status(403).json({ message: 'Solo administradores pueden cerrar cajas de otros usuarios' });
        }
        const { targetUserId, closingAmountUsd, closingAmountBs } = req.body;
        if (!targetUserId || typeof targetUserId !== 'number') {
            return res.status(400).json({ message: 'Se requiere el ID del usuario (targetUserId)' });
        }
        if (typeof closingAmountUsd !== 'number' || typeof closingAmountBs !== 'number') {
            return res.status(400).json({ message: 'Los montos de cierre (USD y Bs) son requeridos y deben ser números.' });
        }
        const session = yield cashRegisterService.closeSession(targetUserId, closingAmountUsd, closingAmountBs);
        res.status(200).json(session);
    }
    catch (error) {
        console.error('Error closing session by admin:', error);
        if (error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al cerrar la caja', error: error.message });
    }
});
exports.closeByAdmin = closeByAdmin;
// Nuevo: Obtener todas las sesiones activas (para que admin pueda ver y cerrar)
const getActiveSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminRequest = req;
        if (!(0, utils_1.isAdmin)(adminRequest)) {
            return res.status(403).json({ message: 'Solo administradores pueden ver todas las sesiones activas' });
        }
        const sessions = yield cashRegisterService.getAllActiveSessions();
        res.status(200).json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener sesiones activas', error: error.message });
    }
});
exports.getActiveSessions = getActiveSessions;
const getClosingPreview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const previewData = yield cashRegisterService.getClosingPreview(userId);
        res.status(200).json(previewData);
    }
    catch (error) {
        if (error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al obtener la previsualización del cierre', error: error.message });
    }
});
exports.getClosingPreview = getClosingPreview;
// Nuevo: Preview de cierre para admin de un cajero específico
const getClosingPreviewByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminRequest = req;
        if (!(0, utils_1.isAdmin)(adminRequest)) {
            return res.status(403).json({ message: 'Solo administradores pueden ver preview de otros usuarios' });
        }
        const targetUserId = parseInt(req.params.userId);
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID de usuario inválido' });
        }
        const previewData = yield cashRegisterService.getClosingPreview(targetUserId);
        res.status(200).json(previewData);
    }
    catch (error) {
        if (error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al obtener la previsualización del cierre', error: error.message });
    }
});
exports.getClosingPreviewByAdmin = getClosingPreviewByAdmin;
const getActiveSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Attempting to get active cash register session...');
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const session = yield cashRegisterService.getActiveSession(userId);
        if (session) {
            res.status(200).json(session);
        }
        else {
            res.status(404).json({ message: 'No hay una sesión de caja activa para este usuario.' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener la sesión activa', error: error.message });
    }
});
exports.getActiveSession = getActiveSession;
const getAllCashMovements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        const adminRequest = req;
        const userIsAdmin = (0, utils_1.isAdmin)(adminRequest);
        const { startDate, endDate, type, ticketNumber } = req.query;
        const filters = {
            startDate: startDate ? String(startDate) : undefined,
            endDate: endDate ? String(endDate) : undefined,
            type: type ? String(type) : undefined,
            ticketNumber: ticketNumber ? String(ticketNumber) : undefined,
        };
        // Si es admin, ve todos. Si es cajero, solo ve sus movimientos
        const movements = yield cashRegisterService.getAllCashMovements(filters, userIsAdmin ? undefined : userId !== null && userId !== void 0 ? userId : undefined);
        res.status(200).json(movements);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener movimientos de caja', error: error.message });
    }
});
exports.getAllCashMovements = getAllCashMovements;
const getAllSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        const adminRequest = req;
        const userIsAdmin = (0, utils_1.isAdmin)(adminRequest);
        // Si es admin, ve todas las sesiones. Si es cajero, solo ve las suyas
        const sessions = yield cashRegisterService.getAllSessions(userIsAdmin ? undefined : userId !== null && userId !== void 0 ? userId : undefined);
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching cash register sessions', error: error.message });
    }
});
exports.getAllSessions = getAllSessions;
const advance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { amountToGive, percentage, paymentMethod } = req.body;
        if (typeof amountToGive !== 'number' || typeof percentage !== 'number' || !paymentMethod) {
            return res.status(400).json({ message: 'Datos inválidos. Se requiere amountToGive (número), percentage (número) y paymentMethod (string).' });
        }
        const result = yield cashRegisterService.processCashAdvance(userId, amountToGive, percentage, paymentMethod);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al procesar avance de efectivo', error: error.message });
    }
});
exports.advance = advance;
/**
 * CORTE X - Lectura Parcial (Solo consulta, NO modifica datos)
 */
const getCorteX = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const corteX = yield cashRegisterService.getCorteX(userId);
        res.status(200).json(corteX);
    }
    catch (error) {
        if (error.message.includes('sesión') || error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al generar Corte X', error: error.message });
    }
});
exports.getCorteX = getCorteX;
/**
 * CORTE X por Admin - Lee datos de otro usuario
 */
const getCorteXByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminRequest = req;
        if (!(0, utils_1.isAdmin)(adminRequest)) {
            return res.status(403).json({ message: 'Solo administradores pueden ver Corte X de otros usuarios' });
        }
        const targetUserId = parseInt(req.params.userId);
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID de usuario inválido' });
        }
        const corteX = yield cashRegisterService.getCorteX(targetUserId);
        res.status(200).json(corteX);
    }
    catch (error) {
        if (error.message.includes('sesión') || error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al generar Corte X', error: error.message });
    }
});
exports.getCorteXByAdmin = getCorteXByAdmin;
/**
 * CORTE Z - Cierre de Caja (Transaccional)
 */
const processCorteZ = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, utils_1.getUserIdFromRequest)(req);
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { conteoReal } = req.body;
        if (!conteoReal || typeof conteoReal.efectivoUsd !== 'number' || typeof conteoReal.efectivoBs !== 'number') {
            return res.status(400).json({
                message: 'Datos inválidos. Se requiere conteoReal con efectivoUsd y efectivoBs.'
            });
        }
        const result = yield cashRegisterService.processCorteZ(userId, conteoReal, false);
        res.status(200).json(result);
    }
    catch (error) {
        if (error.message.includes('sesión') || error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al procesar Corte Z', error: error.message });
    }
});
exports.processCorteZ = processCorteZ;
/**
 * CORTE Z por Admin - Cierra caja de otro usuario
 */
const processCorteZByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminRequest = req;
        if (!(0, utils_1.isAdmin)(adminRequest)) {
            return res.status(403).json({ message: 'Solo administradores pueden cerrar cajas de otros usuarios' });
        }
        const { targetUserId, conteoReal } = req.body;
        if (!targetUserId || typeof targetUserId !== 'number') {
            return res.status(400).json({ message: 'Se requiere el ID del usuario (targetUserId)' });
        }
        if (!conteoReal || typeof conteoReal.efectivoUsd !== 'number' || typeof conteoReal.efectivoBs !== 'number') {
            return res.status(400).json({
                message: 'Datos inválidos. Se requiere conteoReal con efectivoUsd y efectivoBs.'
            });
        }
        const result = yield cashRegisterService.processCorteZ(targetUserId, conteoReal, true);
        res.status(200).json(result);
    }
    catch (error) {
        if (error.message.includes('sesión') || error.message.includes('abierta')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al procesar Corte Z', error: error.message });
    }
});
exports.processCorteZByAdmin = processCorteZByAdmin;
