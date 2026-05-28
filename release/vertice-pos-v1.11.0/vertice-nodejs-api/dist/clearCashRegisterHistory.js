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
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function clearCashRegisterHistory() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Delete all CashMovement records first due to foreign key constraint
            yield prisma.cashMovement.deleteMany();
            console.log('All CashMovement records deleted.');
            // Then delete all CashRegisterSession records
            yield prisma.cashRegisterSession.deleteMany();
            console.log('All CashRegisterSession records deleted.');
            console.log('Cash register history cleared successfully.');
        }
        catch (error) {
            console.error('Error clearing cash register history:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
clearCashRegisterHistory();
