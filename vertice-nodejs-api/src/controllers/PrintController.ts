import { Request, Response } from 'express';
import { PrintService } from '../services/PrintService';

export class PrintController {
  private printService: PrintService;

  constructor() {
    this.printService = new PrintService();
  }

  public printTicket = async (req: Request, res: Response) => {
    const { sale, exchangeRate, printerName } = req.body;

    if (!sale || !printerName) {
      res.status(400).json({ success: false, message: 'Missing sale data or printer name.' });
      return;
    }

    try {
      await this.printService.printTicket(sale, exchangeRate, printerName);
      res.json({ success: true, message: 'Ticket enviado a la impresora.' });
    } catch (error) {
      console.error('Error printing ticket:', error);
      res.status(500).json({ success: false, message: 'Error al imprimir el ticket.' });
    }
  };
}
