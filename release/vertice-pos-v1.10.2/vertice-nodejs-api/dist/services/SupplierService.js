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
exports.supplierService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class SupplierService {
    getAllSuppliers() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.supplier.findMany();
        });
    }
    getSupplierById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.supplier.findUnique({
                where: { id: id },
            });
        });
    }
    createSupplier(newSupplier) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.supplier.create({ data: newSupplier });
        });
    }
    updateSupplier(id, updatedFields) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma.supplier.update({
                    where: { id: id },
                    data: Object.assign(Object.assign({}, updatedFields), { updatedAt: new Date() }),
                });
            }
            catch (error) {
                return null;
            }
        });
    }
    deleteSupplier(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.supplier.delete({
                    where: { id: id },
                });
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
}
exports.supplierService = new SupplierService();
