import { PrismaClient, ExchangeRate } from '@prisma/client';

const prisma = new PrismaClient();

class ExchangeRateService {
  // The ID of the single exchange rate entry we manage.
  private rateId = 1;

  constructor() {
    this.initializeRate();
  }

  private async initializeRate() {
    const rate = await prisma.exchangeRate.findUnique({ where: { id: this.rateId } });
    if (!rate) {
      await prisma.exchangeRate.create({
        data: {
          id: this.rateId,
          rate: 36.5, // Default initial rate
        },
      });
    }
  }

  async getCurrentExchangeRate(): Promise<ExchangeRate | null> {
    return prisma.exchangeRate.findUnique({ where: { id: this.rateId } });
  }

  async updateExchangeRate(newRate: number): Promise<ExchangeRate> {
    return prisma.exchangeRate.update({
      where: { id: this.rateId },
      data: { rate: newRate },
    });
  }
}

export const exchangeRateService = new ExchangeRateService();
