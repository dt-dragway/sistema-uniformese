import { PrismaClient, Prisma } from '@prisma/client';
import { exchangeRateService } from './ExchangeRateService';

const prisma = new PrismaClient();

const saleWithRelations = Prisma.validator<Prisma.SaleDefaultArgs>()({
  include: {
    items: { include: { product: true } },
    payments: true,
    customer: true,
    cashRegisterSession: true,
    adjustments: true,
  },
});
type SaleWithRelations = Prisma.SaleGetPayload<typeof saleWithRelations>;

interface PaymentData {
  method: string;
  amount: number;
  reference?: string;
}

interface SaleCreateData {
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  payments: PaymentData[];
  totalUsd: number;
  totalBs: number;
  customerId?: number;
  cashRegisterSessionId: number;
  discount?: number;
  discountType?: string | null;
  discountValue?: number;
}

class SaleService {
  async getAllSales(): Promise<SaleWithRelations[]> {
    return prisma.sale.findMany({
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashRegisterSession: true,
        adjustments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSalesByUser(userId: number): Promise<SaleWithRelations[]> {
    return prisma.sale.findMany({
      where: {
        cashRegisterSession: {
          userId: userId
        }
      },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashRegisterSession: true,
        adjustments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSaleById(id: number): Promise<SaleWithRelations | null> {
    return prisma.sale.findUnique({
      where: { id: id },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashRegisterSession: true,
        adjustments: true,
      },
    });
  }

  async getSaleByTicketNumber(ticketNumber: string): Promise<SaleWithRelations | null> {
    return prisma.sale.findUnique({
      where: { ticketNumber },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashRegisterSession: true,
        adjustments: true,
      },
    });
  }

  async createSale(saleData: SaleCreateData): Promise<SaleWithRelations> {
    const { items, payments, customerId, cashRegisterSessionId, ...saleInfo } = saleData;

    if (!payments || payments.length === 0) {
      throw new Error('No se puede crear una venta sin pagos asociados.');
    }

    const creditPayment = payments.find((p) => p.method === 'Crédito a Cliente');
    const otherPayments = payments.filter((p) => p.method !== 'Crédito a Cliente');

    const ticketNumber = `${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      // 1. Decrement stock
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Existencia insuficiente para: ${product?.name || 'Producto'}`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantityChange: -item.quantity,
            reason: `Venta Uniformes #${ticketNumber}`,
          },
        });
      }

      // 2. Create the Sale record
      const newSale = await tx.sale.create({
        data: {
          ...saleInfo,
          ticketNumber,
          cashRegisterSessionId,
          customerId: customerId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          payments: {
            create: payments.map((p) => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference ?? null,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
          cashRegisterSession: true,
          adjustments: true,
        },
      });

      const exchangeRate = await exchangeRateService.getCurrentExchangeRate();
      if (!exchangeRate) throw new Error('Exchange rate not found');

      // 3. Cash movements (Only for real payments, not credits)
      for (const payment of otherPayments) {
        await tx.cashMovement.create({
          data: {
            cashRegisterSessionId: cashRegisterSessionId,
            saleId: newSale.id,
            type: 'venta',
            amountUsd: payment.amount,
            amountBs: payment.amount * exchangeRate.rate,
            paymentMethod: payment.method,
            description: `Venta #${newSale.ticketNumber} (${payment.method})`,
          },
        });
      }

      // 4. Credit logic
      if (creditPayment && customerId) {
        const session = await tx.cashRegisterSession.findUnique({ where: { id: cashRegisterSessionId } });
        await tx.creditPayment.create({
          data: {
            customerId,
            userId: session?.userId,
            cashRegisterSessionId,
            amount: creditPayment.amount,
            amountBs: creditPayment.amount * exchangeRate.rate,
            exchangeRate: exchangeRate.rate,
            description: `Venta Uniformes #${newSale.ticketNumber}`,
            paymentMethod: 'Crédito',
          },
        });

        await tx.customer.update({
          where: { id: customerId },
          data: { currentCredit: { increment: creditPayment.amount } },
        });
      }

      return newSale;
    });
  }

  async cancelSale(id: number): Promise<SaleWithRelations | null> {
    return prisma.$transaction(async (tx) => {
      const saleToCancel = await tx.sale.findUnique({
        where: { id },
        include: { items: true, cashRegisterSession: true },
      });

      if (!saleToCancel || saleToCancel.isCancelled) {
        throw new Error('Sale not found or already cancelled.');
      }

      for (const item of saleToCancel.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'RETURN',
            quantityChange: item.quantity,
            reason: `Anulación de Venta #${saleToCancel.ticketNumber}`,
          },
        });
      }

      const cancelledSale = await tx.sale.update({
        where: { id: id },
        data: { isCancelled: true },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
          cashRegisterSession: true,
          adjustments: true,
        },
      });

      if (cancelledSale.cashRegisterSessionId) {
        const currentRate = await exchangeRateService.getCurrentExchangeRate();
        for (const payment of cancelledSale.payments) {
          await tx.cashMovement.create({
            data: {
              cashRegisterSessionId: cancelledSale.cashRegisterSessionId,
              saleId: cancelledSale.id,
              type: 'anulacion',
              amountUsd: -payment.amount,
              amountBs: -(payment.amount * (currentRate?.rate || 1)),
              paymentMethod: payment.method,
              description: `REVERSA: Anulación #${cancelledSale.ticketNumber}`,
            },
          });

          if (payment.method === 'Crédito a Cliente' && cancelledSale.customerId) {
            await tx.creditPayment.create({
              data: {
                customerId: cancelledSale.customerId,
                userId: cancelledSale.cashRegisterSession?.userId,
                cashRegisterSessionId: cancelledSale.cashRegisterSessionId,
                amount: -payment.amount,
                amountBs: -(payment.amount * (currentRate?.rate || 1)),
                exchangeRate: currentRate?.rate || 1,
                description: `REVERSA: Anulación #${cancelledSale.ticketNumber}`,
                paymentMethod: 'Anulación',
              }
            });

            await tx.customer.update({
              where: { id: cancelledSale.customerId },
              data: { currentCredit: { decrement: payment.amount } },
            });
          }
        }
      }

      return cancelledSale;
    });
  }

  async checkDuplicateReference(reference: string, paymentMethods: string[]): Promise<{ isDuplicate: boolean; existingTicket?: string }> {
    if (!reference || reference.trim() === '') return { isDuplicate: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingPayment = await prisma.payment.findFirst({
      where: {
        reference: reference.trim(),
        method: { in: paymentMethods },
        sale: { createdAt: { gte: today, lt: tomorrow }, isCancelled: false },
      },
      include: { sale: true },
    });

    if (existingPayment) {
      return { isDuplicate: true, existingTicket: existingPayment.sale.ticketNumber };
    }
    return { isDuplicate: false };
  }
}

export const saleService = new SaleService();
