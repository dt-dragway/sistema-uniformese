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
exports.seedServices = exports.updateStatus = exports.createRecharge = exports.getRechargesBySession = exports.getRecharges = exports.getServices = void 0;
const RechargeService_1 = require("../services/RechargeService");
const getServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield RechargeService_1.rechargeService.getServices();
        res.json(services);
    }
    catch (error) {
        console.error('Error fetching recharge services:', error);
        res.status(500).json({ message: 'Error fetching recharge services', error });
    }
});
exports.getServices = getServices;
const getRecharges = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { dateFrom, dateTo } = req.query;
        const recharges = yield RechargeService_1.rechargeService.getAllRecharges(dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
        res.json(recharges);
    }
    catch (error) {
        console.error('Error fetching recharges:', error);
        res.status(500).json({ message: 'Error fetching recharges', error });
    }
});
exports.getRecharges = getRecharges;
const getRechargesBySession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const recharges = yield RechargeService_1.rechargeService.getRechargesBySession(parseInt(sessionId));
        res.json(recharges);
    }
    catch (error) {
        console.error('Error fetching recharges by session:', error);
        res.status(500).json({ message: 'Error fetching recharges', error });
    }
});
exports.getRechargesBySession = getRechargesBySession;
const createRecharge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceId, phoneNumber, amountBs, commissionPercent, cashRegisterSessionId } = req.body;
        if (!serviceId || !phoneNumber || !amountBs || commissionPercent === undefined || !cashRegisterSessionId) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }
        const recharge = yield RechargeService_1.rechargeService.createRecharge({
            serviceId,
            phoneNumber,
            amountBs,
            commissionPercent,
            cashRegisterSessionId,
        });
        res.status(201).json(recharge);
    }
    catch (error) {
        console.error('Error creating recharge:', error);
        res.status(500).json({ message: 'Error creating recharge', error });
    }
});
exports.createRecharge = createRecharge;
const updateStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id || !status) {
            return res.status(400).json({ message: 'ID and status are required' });
        }
        const recharge = yield RechargeService_1.rechargeService.updateStatus(parseInt(id), status);
        res.json(recharge);
    }
    catch (error) {
        console.error('Error updating recharge status:', error);
        res.status(500).json({ message: 'Error updating recharge status', error });
    }
});
exports.updateStatus = updateStatus;
const seedServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield RechargeService_1.rechargeService.seedServices();
        res.json(result);
    }
    catch (error) {
        console.error('Error seeding services:', error);
        res.status(500).json({ message: 'Error seeding services', error });
    }
});
exports.seedServices = seedServices;
