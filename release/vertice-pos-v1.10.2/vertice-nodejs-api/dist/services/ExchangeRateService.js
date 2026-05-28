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
exports.exchangeRateService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ExchangeRateService {
    constructor() {
        // The ID of the single exchange rate entry we manage.
        this.rateId = 1;
        this.initializeRate();
    }
    initializeRate() {
        return __awaiter(this, void 0, void 0, function* () {
            const rate = yield prisma.exchangeRate.findUnique({ where: { id: this.rateId } });
            if (!rate) {
                yield prisma.exchangeRate.create({
                    data: {
                        id: this.rateId,
                        rate: 36.5, // Default initial rate
                    },
                });
            }
        });
    }
    getCurrentExchangeRate() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.exchangeRate.findUnique({ where: { id: this.rateId } });
        });
    }
    updateExchangeRate(newRate) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.exchangeRate.update({
                where: { id: this.rateId },
                data: { rate: newRate },
            });
        });
    }
}
exports.exchangeRateService = new ExchangeRateService();
