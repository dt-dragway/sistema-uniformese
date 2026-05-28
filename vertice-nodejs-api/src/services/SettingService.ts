import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const PRINT_SERVER_URL = 'http://localhost:3001';

export class SettingService {
  async getSetting(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    return setting ? setting.value : null;
  }

  async saveSetting(key: string, value: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getSystemPrinters(): Promise<string[]> {
    try {
      const response = await axios.get(`${PRINT_SERVER_URL}/get-printers`);
      if (response.data.success && Array.isArray(response.data.printers)) {
        // The print server returns an array of objects like { name: 'PrinterName', ... }
        return response.data.printers.map((printer: any) => printer.name);
      }
      throw new Error('Invalid response from print server for printers.');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching printers from print server:', error.message);
      } else {
        console.error('An unknown error occurred while fetching printers from print server.');
      }
      throw new Error('Failed to fetch system printers from print server.');
    }
  }
}
