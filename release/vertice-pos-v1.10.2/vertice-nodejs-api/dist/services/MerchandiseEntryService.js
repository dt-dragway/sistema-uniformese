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
exports.merchandiseEntryService = void 0;
const client_1 = require("@prisma/client");
const ProductService_1 = require("./ProductService");
const prisma = new client_1.PrismaClient();
class MerchandiseEntryService {
    createEntry(newEntry) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield ProductService_1.productService.getProductById(newEntry.productId);
            if (!product) {
                return undefined; // Product not found
            }
            // Update product stock and recalculate average cost
            const totalCostBefore = product.stock * product.cost;
            const newTotalCost = totalCostBefore + newEntry.quantity * newEntry.cost;
            const newTotalStock = product.stock + newEntry.quantity;
            const newAverageCost = newTotalStock > 0 ? newTotalCost / newTotalStock : 0;
            yield ProductService_1.productService.updateProduct(product.id, {
                stock: newTotalStock,
                cost: newAverageCost,
            });
            return prisma.merchandiseEntry.create({
                data: {
                    productId: newEntry.productId,
                    quantity: newEntry.quantity,
                    cost: newEntry.cost,
                    supplier: newEntry.supplier,
                },
            });
        });
    }
    getAllEntries() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.merchandiseEntry.findMany();
        });
    }
    getEntryById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.merchandiseEntry.findUnique({
                where: { id: id },
            });
        });
    }
}
exports.merchandiseEntryService = new MerchandiseEntryService();
