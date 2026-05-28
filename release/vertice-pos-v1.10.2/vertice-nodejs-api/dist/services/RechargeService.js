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
exports.rechargeService = exports.RechargeService = void 0;
const client_1 = require("@prisma/client");
const ExchangeRateService_1 = require("./ExchangeRateService");
const prisma = new client_1.PrismaClient();
class RechargeService {
    getServices() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.rechargeService.findMany({
                where: { isEnabled: true },
                orderBy: { name: 'asc' },
            });
        });
    }
    getAllRecharges(dateFrom, dateTo) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (dateFrom && dateTo) {
                where.createdAt = {
                    gte: dateFrom,
                    lte: dateTo,
                };
            }
            return prisma.recharge.findMany({
                where,
                include: {
                    service: true,
                },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    getRechargesBySession(cashRegisterSessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.recharge.findMany({
                where: { cashRegisterSessionId },
                include: { service: true },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    createRecharge(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Calcular comisión
            const commissionBs = data.amountBs * (data.commissionPercent / 100);
            const totalChargeBs = data.amountBs + commissionBs;
            // Obtener tasa de cambio
            const currentRate = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
            const rate = (currentRate === null || currentRate === void 0 ? void 0 : currentRate.rate) || 1;
            const amountUsd = totalChargeBs / rate;
            // Generar número de ticket
            const ticketNumber = yield this.generateTicketNumber();
            // Crear la recarga
            const recharge = yield prisma.recharge.create({
                data: {
                    ticketNumber,
                    serviceId: data.serviceId,
                    phoneNumber: data.phoneNumber,
                    amountBs: data.amountBs,
                    commissionPercent: data.commissionPercent,
                    commissionBs,
                    totalChargeBs,
                    amountUsd,
                    exchangeRate: rate,
                    cashRegisterSessionId: data.cashRegisterSessionId,
                },
                include: { service: true },
            });
            // Crear movimiento de caja
            yield prisma.cashMovement.create({
                data: {
                    cashRegisterSessionId: data.cashRegisterSessionId,
                    type: 'recharge',
                    amountUsd: amountUsd,
                    amountBs: totalChargeBs,
                    description: `Recarga ${recharge.service.name} - ${data.phoneNumber}`,
                },
            });
            return recharge;
        });
    }
    updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.recharge.update({
                where: { id },
                data: { status },
                include: { service: true },
            });
        });
    }
    generateTicketNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const lastRecharge = yield prisma.recharge.findFirst({
                where: {
                    ticketNumber: { startsWith: `R${dateStr}` },
                },
                orderBy: { ticketNumber: 'desc' },
            });
            let sequence = 1;
            if (lastRecharge) {
                const lastSequence = parseInt(lastRecharge.ticketNumber.slice(-4));
                sequence = lastSequence + 1;
            }
            return `R${dateStr}${sequence.toString().padStart(4, '0')}`;
        });
    }
    seedServices() {
        return __awaiter(this, void 0, void 0, function* () {
            const services = [
                { name: 'Movistar Celular', icon: '📱' },
                { name: 'Movistar Fijo', icon: '📞' },
                { name: 'Digitel', icon: '📱' },
                { name: 'Movilnet', icon: '📱' },
                { name: 'CANTV', icon: '📞' },
                { name: 'Inter', icon: '🌐' },
                { name: 'SimpleTV', icon: '📺' },
            ];
            for (const service of services) {
                yield prisma.rechargeService.upsert({
                    where: { name: service.name },
                    update: {},
                    create: service,
                });
            }
            return { message: 'Services seeded successfully' };
        });
    }
}
exports.RechargeService = RechargeService;
exports.rechargeService = new RechargeService();
