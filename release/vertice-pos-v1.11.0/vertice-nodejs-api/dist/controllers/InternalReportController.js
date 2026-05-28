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
exports.getInternalDispatchStats = void 0;
const client_1 = require("@prisma/client");
const ExchangeRateService_1 = require("../services/ExchangeRateService");
const prisma = new client_1.PrismaClient();
const getInternalDispatchStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        const whereClause = {
            type: { notIn: ['SALE', 'RETURN'] },
        };
        if (startDate && endDate) {
            whereClause.timestamp = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        // Get internal dispatch movements
        const movements = yield prisma.inventoryMovement.findMany({
            where: whereClause,
            include: {
                product: true,
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
        // Get current exchange rate
        const currentRate = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
        const rate = (currentRate === null || currentRate === void 0 ? void 0 : currentRate.rate) || 1;
        // Calculate statistics
        let totalValueUsd = 0;
        let totalValueBs = 0;
        let totalSaleValueUsd = 0; // Valor si se vendiera
        let totalSaleValueBs = 0;
        let totalItems = 0;
        const byDay = {};
        const byProduct = {};
        movements.forEach((movement) => {
            const quantity = Math.abs(movement.quantityChange);
            const costValueUsd = quantity * movement.product.cost;
            const saleValueUsd = quantity * movement.product.price; // Precio de venta
            const costValueBs = costValueUsd * rate;
            const saleValueBs = saleValueUsd * rate;
            totalValueUsd += costValueUsd;
            totalValueBs += costValueBs;
            totalSaleValueUsd += saleValueUsd;
            totalSaleValueBs += saleValueBs;
            totalItems += quantity;
            // Group by day
            const day = movement.timestamp.toISOString().split('T')[0];
            if (!byDay[day]) {
                byDay[day] = { cost: 0, saleValue: 0 };
            }
            byDay[day].cost += costValueUsd;
            byDay[day].saleValue += saleValueUsd;
            // Group by product
            if (!byProduct[movement.productId]) {
                byProduct[movement.productId] = {
                    name: movement.product.name,
                    quantity: 0,
                    value: 0,
                    saleValue: 0,
                };
            }
            byProduct[movement.productId].quantity += quantity;
            byProduct[movement.productId].value += costValueUsd;
            byProduct[movement.productId].saleValue += saleValueUsd;
        });
        // Convert to arrays for frontend
        const dailyData = Object.entries(byDay)
            .map(([date, values]) => ({
            date,
            cost: values.cost,
            saleValue: values.saleValue,
        }))
            .sort((a, b) => a.date.localeCompare(b.date));
        const productData = Object.values(byProduct)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 products
        res.json({
            totalValueUsd,
            totalValueBs,
            totalSaleValueUsd,
            totalSaleValueBs,
            totalItems,
            movementCount: movements.length,
            averageValueUsd: movements.length > 0 ? totalValueUsd / movements.length : 0,
            averageSaleValueUsd: movements.length > 0 ? totalSaleValueUsd / movements.length : 0,
            dailyData,
            productData,
        });
    }
    catch (error) {
        console.error('Error fetching internal dispatch stats:', error);
        res.status(500).json({ message: 'Error fetching internal dispatch statistics', error });
    }
});
exports.getInternalDispatchStats = getInternalDispatchStats;
