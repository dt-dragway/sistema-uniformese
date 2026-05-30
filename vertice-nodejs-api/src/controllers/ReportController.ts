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

export const exportSalesExcel = async (req: Request, res: Response) => {
  try {
    const excelBuffer = await reportService.generateSalesExcel();

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`reporte_ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ message: 'Error generating Excel sales report', error });
  }
};

export const exportCashRegisterExcel = async (req: Request, res: Response) => {
  try {
    const excelBuffer = await reportService.generateCashRegisterExcel();

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`reporte_cajas_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Cash Register Excel report:', error);
    res.status(500).json({ message: 'Error generating Excel cash register report', error });
  }
};

export const exportInventoryMovementsExcel = async (req: Request, res: Response) => {
  try {
    const excelBuffer = await reportService.generateInventoryMovementsExcel();

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`reporte_inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Inventory Excel report:', error);
    res.status(500).json({ message: 'Error generating Excel inventory report', error });
  }
};

export const exportConnectionsExcel = async (req: Request, res: Response) => {
  try {
    const excelBuffer = await reportService.generateConnectionsExcel();

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`reporte_conexiones_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Connections Excel report:', error);
    res.status(500).json({ message: 'Error generating Excel connections report', error });
  }
};
