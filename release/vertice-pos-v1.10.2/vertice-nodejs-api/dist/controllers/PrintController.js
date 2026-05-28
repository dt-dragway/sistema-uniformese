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
exports.PrintController = void 0;
const PrintService_1 = require("../services/PrintService");
class PrintController {
    constructor() {
        this.printTicket = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { sale, exchangeRate, printerName } = req.body;
            if (!sale || !printerName) {
                res.status(400).json({ success: false, message: 'Missing sale data or printer name.' });
                return;
            }
            try {
                yield this.printService.printTicket(sale, exchangeRate, printerName);
                res.json({ success: true, message: 'Ticket enviado a la impresora.' });
            }
            catch (error) {
                console.error('Error printing ticket:', error);
                res.status(500).json({ success: false, message: 'Error al imprimir el ticket.' });
            }
        });
        this.printService = new PrintService_1.PrintService();
    }
}
exports.PrintController = PrintController;
