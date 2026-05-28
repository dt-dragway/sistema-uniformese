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
exports.updateExchangeRate = exports.getCurrentExchangeRate = void 0;
const ExchangeRateService_1 = require("../services/ExchangeRateService");
const getCurrentExchangeRate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rate = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
        if (rate) {
            res.json(rate);
        }
        else {
            res.status(404).send('Exchange rate not set');
        }
    }
    catch (error) {
        res.status(500).send('Error fetching exchange rate');
    }
});
exports.getCurrentExchangeRate = getCurrentExchangeRate;
const updateExchangeRate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rate } = req.body;
        if (rate === undefined || typeof rate !== 'number' || rate <= 0) {
            return res.status(400).send('Invalid exchange rate provided');
        }
        const updatedRate = yield ExchangeRateService_1.exchangeRateService.updateExchangeRate(rate);
        res.json(updatedRate);
    }
    catch (error) {
        res.status(500).send('Error updating exchange rate');
    }
});
exports.updateExchangeRate = updateExchangeRate;
