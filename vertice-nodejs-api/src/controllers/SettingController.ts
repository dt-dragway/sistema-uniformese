import { Request, Response } from 'express';
import { SettingService } from '../services/SettingService';

export class SettingController {
  private settingService: SettingService;

  constructor() {
    this.settingService = new SettingService();
  }

  public getPrinter = async (req: Request, res: Response): Promise<void> => {
    try {
      const printer = await this.settingService.getSetting('printerName');
      res.json({ success: true, printer });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get printer setting.' });
    }
  };

  public savePrinter = async (req: Request, res: Response): Promise<void> => {
    const { printerName } = req.body;
    if (!printerName) {
      res.status(400).json({ success: false, message: 'Missing printerName.' });
      return;
    }

    try {
      await this.settingService.saveSetting('printerName', printerName);
      res.json({ success: true, message: 'Printer setting saved.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save printer setting.' });
    }
  };

  public getCommissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const rechargeCommission = await this.settingService.getSetting('rechargeCommissionPercent');
      const cashAdvanceCommission = await this.settingService.getSetting('cashAdvanceCommissionPercent');

      res.json({
        success: true,
        rechargeCommissionPercent: rechargeCommission ? parseFloat(rechargeCommission) : 20,
        cashAdvanceCommissionPercent: cashAdvanceCommission ? parseFloat(cashAdvanceCommission) : 20,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get commission settings.' });
    }
  };

  public saveCommissions = async (req: Request, res: Response): Promise<void> => {
    const { rechargeCommissionPercent, cashAdvanceCommissionPercent } = req.body;

    try {
      if (rechargeCommissionPercent !== undefined) {
        await this.settingService.saveSetting('rechargeCommissionPercent', rechargeCommissionPercent.toString());
      }
      if (cashAdvanceCommissionPercent !== undefined) {
        await this.settingService.saveSetting('cashAdvanceCommissionPercent', cashAdvanceCommissionPercent.toString());
      }
      res.json({ success: true, message: 'Commission settings saved.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save commission settings.' });
    }
  };
}
