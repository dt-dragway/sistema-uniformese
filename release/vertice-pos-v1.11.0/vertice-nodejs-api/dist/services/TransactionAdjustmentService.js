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
exports.transactionAdjustmentService = void 0;
const client_1 = require("@prisma/client");
const SaleService_1 = require("./SaleService");
const ProductService_1 = require("./ProductService");
const prisma = new client_1.PrismaClient();
class TransactionAdjustmentService {
    createAdjustment(newAdjustment) {
        return __awaiter(this, void 0, void 0, function* () {
            const sale = yield SaleService_1.saleService.getSaleById(newAdjustment.saleId);
            if (!sale) {
                return undefined; // Sale not found
            }
            // Reverse stock logic
            if (newAdjustment.type === 'cancellation') {
                yield SaleService_1.saleService.cancelSale(sale.id);
                for (const item of sale.items) {
                    const product = yield ProductService_1.productService.getProductById(item.productId);
                    if (product) {
                        yield ProductService_1.productService.updateProduct(product.id, { stock: product.stock + item.quantity });
                    }
                }
            }
            else if (newAdjustment.type === 'return' && newAdjustment.adjustedItems) {
                for (const adjustedItem of newAdjustment.adjustedItems) {
                    const product = yield ProductService_1.productService.getProductById(adjustedItem.productId);
                    if (product) {
                        yield ProductService_1.productService.updateProduct(product.id, { stock: product.stock + adjustedItem.quantity });
                    }
                }
            }
            // Create the adjustment record
            return prisma.transactionAdjustment.create({
                data: {
                    saleId: newAdjustment.saleId,
                    type: newAdjustment.type,
                    reason: newAdjustment.reason,
                    amountRefunded: newAdjustment.amountRefunded,
                    // Note: adjustedItems is not a field in the DB model, so it's not saved here.
                    // This logic assumes stock is adjusted, and a record of the adjustment is made.
                },
            });
        });
    }
    getAllAdjustments() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.transactionAdjustment.findMany();
        });
    }
    getAdjustmentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.transactionAdjustment.findUnique({
                where: { id: id },
            });
        });
    }
}
exports.transactionAdjustmentService = new TransactionAdjustmentService();
