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
exports.PrintService = void 0;
const axios_1 = __importDefault(require("axios"));
const PRINT_SERVER_URL = 'http://localhost:3001';
class PrintService {
    printTicket(sale, exchangeRate, printerName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios_1.default.post(`${PRINT_SERVER_URL}/print-ticket`, {
                    sale,
                    exchangeRate,
                    printerName,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error('Error forwarding ticket to print server:', error.message);
                }
                else {
                    console.error('An unknown error occurred while forwarding ticket to print server.');
                }
                // Propagate a consistent error to the controller
                throw new Error('Failed to connect to the print server.');
            }
        });
    }
}
exports.PrintService = PrintService;
