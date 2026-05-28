import { Request, Response } from 'express';
import { reportService } from '../services/ReportService'; // Changed back to named import

export const exportSalesCsv = async (req: Request, res: Response) => {
  try {
    const csvData = await reportService.generateSalesCsv();

    res.header('Content-Type', 'text/csv');
    res.attachment('sales_report.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating sales report', error });
  }
};
