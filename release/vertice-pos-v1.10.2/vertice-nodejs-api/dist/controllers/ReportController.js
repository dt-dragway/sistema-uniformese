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
exports.exportSalesCsv = void 0;
const ReportService_1 = require("../services/ReportService"); // Changed back to named import
const exportSalesCsv = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const csvData = yield ReportService_1.reportService.generateSalesCsv();
        res.header('Content-Type', 'text/csv');
        res.attachment('sales_report.csv');
        res.send(csvData);
    }
    catch (error) {
        res.status(500).json({ message: 'Error generating sales report', error });
    }
});
exports.exportSalesCsv = exportSalesCsv;
