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
exports.getAllCreditPayments = exports.addCreditPayment = void 0;
const client_1 = require("@prisma/client");
const ExchangeRateService_1 = require("./ExchangeRateService");
const prisma = new client_1.PrismaClient();
const addCreditPayment = (customerId, amount, description, paymentMethod, reference) => __awaiter(void 0, void 0, void 0, function* () {
    const customer = yield prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
        throw new Error('Customer not found');
    }
    const exchangeRate = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
    if (!exchangeRate) {
        throw new Error('Exchange rate not found');
    }
    const amountBs = amount * exchangeRate.rate;
    const newCreditPayment = yield prisma.creditPayment.create({
        data: {
            customerId,
            amount,
            amountBs,
            exchangeRate: exchangeRate.rate,
            description,
            paymentMethod,
            reference,
        },
    });
    const updatedCustomer = yield prisma.customer.update({
        where: { id: customerId },
        data: {
            currentCredit: {
                increment: amount,
            },
        },
    });
    return { newCreditPayment, updatedCustomer };
});
exports.addCreditPayment = addCreditPayment;
const getAllCreditPayments = (customerId) => __awaiter(void 0, void 0, void 0, function* () {
    const whereClause = customerId ? { customerId } : {};
    const allMovements = yield prisma.creditPayment.findMany({
        where: whereClause,
        orderBy: {
            paymentDate: 'asc', // Important: process in chronological order
        },
    });
    const charges = allMovements.filter((m) => m.amount > 0).map(m => (Object.assign(Object.assign({}, m), { remaining: m.amount, status: 'Pendiente' })));
    const payments = allMovements.filter((m) => m.amount < 0).map(p => (Object.assign(Object.assign({}, p), { available: -p.amount })));
    for (const charge of charges) {
        for (const payment of payments) {
            if (payment.available > 0 && charge.remaining > 0) {
                const amountToApply = Math.min(payment.available, charge.remaining);
                charge.remaining -= amountToApply;
                payment.available -= amountToApply;
                // Normalize very small values to zero to avoid floating point errors
                // Tolerance of 0.01 (1 centavo)
                if (Math.abs(charge.remaining) < 0.01) {
                    charge.remaining = 0;
                }
                if (charge.remaining <= 0) { // Use <= instead of === for floating point comparison
                    charge.status = 'Pagado';
                    break;
                }
                else {
                    charge.status = 'Parcialmente Pagado';
                }
            }
        }
    }
    const movementsWithStatus = allMovements.map(movement => {
        if (movement.amount > 0) { // Only charges (positive amounts) get a status
            const chargeWithStatus = charges.find(c => c.id === movement.id);
            return Object.assign(Object.assign({}, movement), { status: chargeWithStatus === null || chargeWithStatus === void 0 ? void 0 : chargeWithStatus.status, remaining: chargeWithStatus === null || chargeWithStatus === void 0 ? void 0 : chargeWithStatus.remaining });
        }
        return movement; // Payments (negative amounts) don't get a status
    });
    return movementsWithStatus.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
});
exports.getAllCreditPayments = getAllCreditPayments;
