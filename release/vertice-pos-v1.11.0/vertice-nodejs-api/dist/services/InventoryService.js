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
exports.inventoryService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class InventoryService {
    getAllInventoryMovements() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.inventoryMovement.findMany({
                include: {
                    product: true, // Include product details with each movement
                },
                orderBy: {
                    timestamp: 'desc',
                },
            });
        });
    }
    getInventoryMovementsByProductId(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.inventoryMovement.findMany({
                where: { productId },
                include: {
                    product: true,
                },
                orderBy: {
                    timestamp: 'desc',
                },
            });
        });
    }
    createMerchandiseEntry(productId, quantity, cost, supplier) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // 1. Create a new MerchandiseEntry record
                const merchandiseEntry = yield tx.merchandiseEntry.create({
                    data: {
                        productId,
                        quantity,
                        cost,
                        supplier,
                    },
                });
                // 2. Update the stock and cost of the corresponding Product
                yield tx.product.update({
                    where: { id: productId },
                    data: {
                        stock: {
                            increment: quantity,
                        },
                        cost, // Update the product's cost
                    },
                });
                // 3. Create an InventoryMovement record and include product details
                const inventoryMovement = yield tx.inventoryMovement.create({
                    data: {
                        productId,
                        type: 'ENTRY',
                        quantityChange: quantity,
                        reason: `Entrada de mercancía #${merchandiseEntry.id}`,
                    },
                    include: {
                        product: true, // Include product details in the returned object
                    },
                });
                return inventoryMovement;
            }));
        });
    }
    createInventoryMovement(productId, type, quantityChange, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.inventoryMovement.create({
                data: {
                    productId,
                    type,
                    quantityChange,
                    reason,
                },
            });
        });
    }
    createInternalWithdrawal(items, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const movements = [];
                for (const item of items) {
                    // 1. Update stock (decrement)
                    const updatedProduct = yield tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    });
                    // 2. Create Movement record
                    const movement = yield tx.inventoryMovement.create({
                        data: {
                            productId: item.productId,
                            type: 'INTERNAL_CONSUMPTION',
                            quantityChange: -item.quantity,
                            reason: `Despacho Interno: ${reason}`,
                        },
                        include: { product: true }
                    });
                    movements.push(movement);
                }
                return movements;
            }));
        });
    }
}
exports.inventoryService = new InventoryService();
