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
exports.reportService = void 0;
const client_1 = require("@prisma/client");
const SaleService_1 = require("./SaleService");
const prisma = new client_1.PrismaClient();
class ReportService {
    generateSalesCsv() {
        return __awaiter(this, void 0, void 0, function* () {
            const sales = yield SaleService_1.saleService.getAllSales();
            if (sales.length === 0) {
                return 'No sales data available.';
            }
            // Define CSV headers
            const headers = [
                'Sale ID',
                'Created At',
                'Total USD',
                'Total Bs',
                'Payment Methods',
                'Is Cancelled',
                'Product ID',
                'Product Name',
                'Quantity',
                'Price (USD)',
            ];
            let csv = headers.join(',') + '\n';
            for (const sale of sales) {
                // Fetch product name for each item (this might be inefficient for large datasets, consider optimizing with Prisma includes)
                const saleItemsData = yield Promise.all(sale.items.map((item) => __awaiter(this, void 0, void 0, function* () {
                    const product = yield prisma.product.findUnique({ where: { id: item.productId } });
                    return Object.assign(Object.assign({}, item), { productName: (product === null || product === void 0 ? void 0 : product.name) || 'Unknown Product' });
                })));
                for (const item of saleItemsData) {
                    const paymentMethods = sale.payments.map(p => p.method).join(', ');
                    const row = [
                        sale.id,
                        sale.createdAt.toISOString(),
                        sale.totalUsd.toFixed(2),
                        sale.totalBs.toFixed(2),
                        paymentMethods,
                        sale.isCancelled ? 'Yes' : 'No',
                        item.productId,
                        item.productName,
                    ];
                    csv += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
                }
            }
            return csv;
        });
    }
}
exports.reportService = new ReportService(); // Changed back to named export
