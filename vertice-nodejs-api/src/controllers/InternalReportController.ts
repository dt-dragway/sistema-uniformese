import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exchangeRateService } from '../services/ExchangeRateService';

const prisma = new PrismaClient();

export const getInternalDispatchStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {
      type: { notIn: ['SALE', 'RETURN'] },
    };

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Get internal dispatch movements
    const movements = await prisma.inventoryMovement.findMany({
      where: whereClause,
      include: {
        product: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Get current exchange rate
    const currentRate = await exchangeRateService.getCurrentExchangeRate();
    const rate = currentRate?.rate || 1;

    // Calculate statistics
    let totalValueUsd = 0;
    let totalValueBs = 0;
    let totalSaleValueUsd = 0; // Valor si se vendiera
    let totalSaleValueBs = 0;
    let totalItems = 0;

    const byDay: Record<string, { cost: number; saleValue: number }> = {};
    const byProduct: Record<string, { name: string; quantity: number; value: number; saleValue: number }> = {};

    movements.forEach((movement) => {
      const quantity = Math.abs(movement.quantityChange);
      const costValueUsd = quantity * movement.product.cost;
      const saleValueUsd = quantity * movement.product.price; // Precio de venta
      const costValueBs = costValueUsd * rate;
      const saleValueBs = saleValueUsd * rate;

      totalValueUsd += costValueUsd;
      totalValueBs += costValueBs;
      totalSaleValueUsd += saleValueUsd;
      totalSaleValueBs += saleValueBs;
      totalItems += quantity;

      // Group by day
      const day = movement.timestamp.toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = { cost: 0, saleValue: 0 };
      }
      byDay[day].cost += costValueUsd;
      byDay[day].saleValue += saleValueUsd;

      // Group by product
      if (!byProduct[movement.productId]) {
        byProduct[movement.productId] = {
          name: movement.product.name,
          quantity: 0,
          value: 0,
          saleValue: 0,
        };
      }
      byProduct[movement.productId].quantity += quantity;
      byProduct[movement.productId].value += costValueUsd;
      byProduct[movement.productId].saleValue += saleValueUsd;
    });

    // Convert to arrays for frontend
    const dailyData = Object.entries(byDay)
      .map(([date, values]) => ({
        date,
        cost: values.cost,
        saleValue: values.saleValue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const productData = Object.values(byProduct)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 products

    res.json({
      totalValueUsd,
      totalValueBs,
      totalSaleValueUsd,
      totalSaleValueBs,
      totalItems,
      movementCount: movements.length,
      averageValueUsd: movements.length > 0 ? totalValueUsd / movements.length : 0,
      averageSaleValueUsd: movements.length > 0 ? totalSaleValueUsd / movements.length : 0,
      dailyData,
      productData,
    });
  } catch (error) {
    console.error('Error fetching internal dispatch stats:', error);
    res.status(500).json({ message: 'Error fetching internal dispatch statistics', error });
  }
};
