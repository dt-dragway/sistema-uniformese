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
exports.customerService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CustomerService {
    getAllCustomers() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.customer.findMany();
        });
    }
    getCustomerById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.customer.findUnique({ where: { id } });
        });
    }
    createCustomer(newCustomerData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prisma handles default values like currentCredit, so we just pass the data.
            return prisma.customer.create({
                data: newCustomerData,
            });
        });
    }
    updateCustomer(id, updatedFields) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.customer.update({
                where: { id },
                data: updatedFields,
            });
        });
    }
    deleteCustomer(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.customer.delete({ where: { id } });
        });
    }
    updateCustomerCredit(id, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.customer.update({
                where: { id },
                data: {
                    currentCredit: {
                        increment: amount,
                    },
                },
            });
        });
    }
}
exports.customerService = new CustomerService();
