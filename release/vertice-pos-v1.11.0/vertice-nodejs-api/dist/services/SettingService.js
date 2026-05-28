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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingService = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
const PRINT_SERVER_URL = 'http://localhost:3001';
class SettingService {
    getSetting(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const setting = yield prisma.setting.findUnique({
                where: { key },
            });
            return setting ? setting.value : null;
        });
    }
    saveSetting(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        });
    }
    getSystemPrinters() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${PRINT_SERVER_URL}/get-printers`);
                if (response.data.success && Array.isArray(response.data.printers)) {
                    // The print server returns an array of objects like { name: 'PrinterName', ... }
                    return response.data.printers.map((printer) => printer.name);
                }
                throw new Error('Invalid response from print server for printers.');
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error('Error fetching printers from print server:', error.message);
                }
                else {
                    console.error('An unknown error occurred while fetching printers from print server.');
                }
                throw new Error('Failed to fetch system printers from print server.');
            }
        });
    }
}
exports.SettingService = SettingService;
