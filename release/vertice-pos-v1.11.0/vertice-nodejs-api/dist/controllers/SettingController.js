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
exports.SettingController = void 0;
const SettingService_1 = require("../services/SettingService");
class SettingController {
    constructor() {
        this.getPrinter = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const printer = yield this.settingService.getSetting('printerName');
                res.json({ success: true, printer });
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Failed to get printer setting.' });
            }
        });
        this.savePrinter = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { printerName } = req.body;
            if (!printerName) {
                res.status(400).json({ success: false, message: 'Missing printerName.' });
                return;
            }
            try {
                yield this.settingService.saveSetting('printerName', printerName);
                res.json({ success: true, message: 'Printer setting saved.' });
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Failed to save printer setting.' });
            }
        });
        this.getCommissions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const rechargeCommission = yield this.settingService.getSetting('rechargeCommissionPercent');
                const cashAdvanceCommission = yield this.settingService.getSetting('cashAdvanceCommissionPercent');
                res.json({
                    success: true,
                    rechargeCommissionPercent: rechargeCommission ? parseFloat(rechargeCommission) : 20,
                    cashAdvanceCommissionPercent: cashAdvanceCommission ? parseFloat(cashAdvanceCommission) : 20,
                });
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Failed to get commission settings.' });
            }
        });
        this.saveCommissions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { rechargeCommissionPercent, cashAdvanceCommissionPercent } = req.body;
            try {
                if (rechargeCommissionPercent !== undefined) {
                    yield this.settingService.saveSetting('rechargeCommissionPercent', rechargeCommissionPercent.toString());
                }
                if (cashAdvanceCommissionPercent !== undefined) {
                    yield this.settingService.saveSetting('cashAdvanceCommissionPercent', cashAdvanceCommissionPercent.toString());
                }
                res.json({ success: true, message: 'Commission settings saved.' });
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Failed to save commission settings.' });
            }
        });
        this.settingService = new SettingService_1.SettingService();
    }
}
exports.SettingController = SettingController;
