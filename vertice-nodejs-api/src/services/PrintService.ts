import axios from 'axios';

const PRINT_SERVER_URL = 'http://localhost:3001';

export class PrintService {
  async printTicket(sale: any, exchangeRate: number, printerName: string): Promise<void> {
    try {
      await axios.post(`${PRINT_SERVER_URL}/print-ticket`, {
        sale,
        exchangeRate,
        printerName,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error forwarding ticket to print server:', error.message);
      } else {
        console.error('An unknown error occurred while forwarding ticket to print server.');
      }
      // Propagate a consistent error to the controller
      throw new Error('Failed to connect to the print server.');
    }
  }
}
