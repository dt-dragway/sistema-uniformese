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
exports.productService = void 0;
const client_1 = require("@prisma/client");
const ExchangeRateService_1 = require("./ExchangeRateService");
const prisma = new client_1.PrismaClient();
class ProductService {
    getAllProducts() {
        return __awaiter(this, arguments, void 0, function* (convertToBs = false) {
            // Only get active products (soft delete filter)
            const products = yield prisma.product.findMany({
                where: { isActive: true },
            });
            if (convertToBs) {
                const rateData = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
                const rate = (rateData === null || rateData === void 0 ? void 0 : rateData.rate) || 1;
                return products.map((product) => (Object.assign(Object.assign({}, product), { price: product.price * rate })));
            }
            return products;
        });
    }
    getProductById(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, convertToBs = false) {
            const product = yield prisma.product.findUnique({
                where: { id: id },
            });
            if (product && convertToBs) {
                const rateData = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
                const rate = (rateData === null || rateData === void 0 ? void 0 : rateData.rate) || 1;
                return Object.assign(Object.assign({}, product), { price: product.price * rate });
            }
            return product;
        });
    }
    createProduct(newProduct) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.product.create({ data: newProduct });
        });
    }
    updateProduct(id, updatedFields) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma.product.update({
                    where: { id: id },
                    data: Object.assign(Object.assign({}, updatedFields), { updatedAt: new Date() }),
                });
            }
            catch (error) {
                // Handle cases where product with id is not found
                return null;
            }
        });
    }
    deleteProduct(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Soft delete: set isActive to false instead of deleting
                yield prisma.product.update({
                    where: { id: id },
                    data: { isActive: false, updatedAt: new Date() },
                });
                return { success: true };
            }
            catch (error) {
                // Handle product not found
                if (error.code === 'P2025') {
                    return { success: false, error: 'El producto no fue encontrado.' };
                }
                return { success: false, error: 'Error al eliminar el producto.' };
            }
        });
    }
    getLowStockProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            // Only get active products with low stock
            return yield prisma.$queryRaw `SELECT * FROM "Product" WHERE "stock" <= "minStock" AND "isActive" = true`;
        });
    }
    getProductByBarcode(barCode_1) {
        return __awaiter(this, arguments, void 0, function* (barCode, convertToBs = false) {
            const product = yield prisma.product.findUnique({
                where: { barCode: barCode },
            });
            if (product && convertToBs) {
                const rateData = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
                const rate = (rateData === null || rateData === void 0 ? void 0 : rateData.rate) || 1;
                return Object.assign(Object.assign({}, product), { price: product.price * rate });
            }
            return product;
        });
    }
    getMostSoldProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            const mostSoldItems = yield prisma.saleItem.groupBy({
                by: ['productId'],
                _sum: {
                    quantity: true,
                },
                orderBy: {
                    _sum: {
                        quantity: 'desc',
                    },
                },
                take: 10,
            });
            const productIds = mostSoldItems.map((item) => item.productId);
            const products = yield prisma.product.findMany({
                where: {
                    id: {
                        in: productIds,
                    },
                },
            });
            // Return products in the order of most sold
            return productIds.map(productId => products.find(p => p.id === productId)).filter((p) => !!p);
        });
    }
}
exports.productService = new ProductService();
