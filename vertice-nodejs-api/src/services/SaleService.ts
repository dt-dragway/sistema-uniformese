import { PrismaClient, Prisma } from '@prisma/client';
import { exchangeRateService } from './ExchangeRateService';

const prisma = new PrismaClient();

const saleWithRelations = Prisma.validator<Prisma.SaleDefaultArgs>()({
  include: {
    items: { include: { product: true } },
    payments: true,
    customer: true,
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
  pendingRecharges?: {
    serviceId: number;
    serviceName: string;
    phoneNumber: string;
    amountBs: number;
    commissionPercent: number;
    commissionBs: number;
    totalChargeBs: number;
  }[];
  pendingCashAdvances?: {
    amountToGive: number;
    commissionPercent: number;
    commissionBs: number;
    totalChargeBs: number;
    paymentMethod: string;
  }[];
}

class SaleService {
  async getAllSales(): Promise<SaleWithRelations[]> {
    return prisma.sale.findMany({
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
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
      },
    });
  }

  async createSale(saleData: SaleCreateData): Promise<SaleWithRelations> {
    // Excluir pendingRecharges y pendingCashAdvances del spread para que no vayan a la tabla Sale
    const { items, payments, customerId, cashRegisterSessionId, pendingRecharges, pendingCashAdvances, ...saleInfo } = saleData;

    const creditPayment = payments.find((p) => p.method === 'Crédito a Cliente');
    const otherPayments = payments.filter((p) => p.method !== 'Crédito a Cliente');

    // Generate a unique ticket number (e.g., based on timestamp)
    const ticketNumber = `${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      // 1. Decrement stock for each product
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ID: ${item.productId}`);
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
            reason: `Venta #${ticketNumber}`,
          },
        });

      }

      // 3. Create the Sale and nested SaleItems and Payments
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
            create: otherPayments.map((p) => ({
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
        },
      });

      const exchangeRate = await exchangeRateService.getCurrentExchangeRate();
      if (!exchangeRate) {
        throw new Error('Exchange rate not found');
      }

      // 4. Create CashMovements for each non-credit payment
      for (const payment of otherPayments) {
        await tx.cashMovement.create({
          data: {
            cashRegisterSessionId: cashRegisterSessionId,
            saleId: newSale.id,
            type: 'venta',
            amountUsd: payment.amount,
            amountBs: payment.amount * exchangeRate.rate,
            paymentMethod: payment.method,
            description: `Ingreso por venta #${newSale.ticketNumber} - Método: ${payment.method}`,
          },
        });
      }

      if (creditPayment && customerId) {
        const amountBs = creditPayment.amount * exchangeRate.rate;

        await tx.creditPayment.create({
          data: {
            customerId,
            amount: creditPayment.amount,
            amountBs,
            exchangeRate: exchangeRate.rate,
            description: `Venta #${newSale.ticketNumber}`,
            paymentMethod: 'Crédito',
          },
        });

        await tx.customer.update({
          where: { id: customerId },
          data: {
            currentCredit: {
              increment: creditPayment.amount,
            },
          },
        });
      }

      // 5. Create pending recharges if any
      if (pendingRecharges && pendingRecharges.length > 0) {
        for (const rechargeData of pendingRecharges) {
          // Generate ticket number for recharge
          const today = new Date();
          const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
          const lastRecharge = await tx.recharge.findFirst({
            where: { ticketNumber: { startsWith: `R${dateStr}` } },
            orderBy: { ticketNumber: 'desc' },
          });
          let sequence = 1;
          if (lastRecharge) {
            const lastSequence = parseInt(lastRecharge.ticketNumber.slice(-4));
            sequence = lastSequence + 1;
          }
          const rechargeTicketNumber = `R${dateStr}${sequence.toString().padStart(4, '0')}`;

          // Calculate USD amount
          const amountUsd = rechargeData.totalChargeBs / exchangeRate.rate;

          // Create the recharge with PENDING status
          await tx.recharge.create({
            data: {
              ticketNumber: rechargeTicketNumber,
              serviceId: rechargeData.serviceId,
              phoneNumber: rechargeData.phoneNumber,
              amountBs: rechargeData.amountBs,
              commissionPercent: rechargeData.commissionPercent,
              commissionBs: rechargeData.commissionBs,
              totalChargeBs: rechargeData.totalChargeBs,
              amountUsd,
              exchangeRate: exchangeRate.rate,
              cashRegisterSessionId,
              status: 'PENDING', // Pagado pero no recargado aún
            },
          });

          // Create cash movement for the recharge
          await tx.cashMovement.create({
            data: {
              cashRegisterSessionId,
              type: 'recharge',
              amountUsd,
              amountBs: rechargeData.totalChargeBs,
              description: `Recarga ${rechargeData.serviceName} - ${rechargeData.phoneNumber} (desde venta #${newSale.ticketNumber})`,
            },
          });
        }
      }

      // 6. Process pending cash advances if any
      if (pendingCashAdvances && pendingCashAdvances.length > 0) {
        for (const advanceData of pendingCashAdvances) {
          const profit = advanceData.commissionBs;

          // Create cash movement for cash outflow (money given to customer)
          await tx.cashMovement.create({
            data: {
              cashRegisterSessionId,
              type: 'avance_salida',
              amountBs: advanceData.amountToGive,
              amountUsd: 0,
              paymentMethod: 'Efectivo Bs.',
              description: `Avance: Entrega de efectivo al cliente (${advanceData.commissionPercent}% com.)`,
            },
          });

          // Create cash movement for income (payment received including commission)
          await tx.cashMovement.create({
            data: {
              cashRegisterSessionId,
              type: 'avance_entrada',
              amountBs: advanceData.totalChargeBs,
              amountUsd: 0,
              paymentMethod: advanceData.paymentMethod,
              description: `Avance: Cobro electrónico (Monto + Comisión ${profit.toFixed(2)} Bs)`,
            },
          });
        }
      }

      return newSale;
    });
  }

  async cancelSale(id: number): Promise<SaleWithRelations | null> {
    return prisma.$transaction(async (tx) => {
      const saleToCancel = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!saleToCancel || saleToCancel.isCancelled) {
        throw new Error('Sale not found or already cancelled.');
      }

      // Increment stock for each item in the cancelled sale
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
            reason: `Cancelación de Venta #${saleToCancel.ticketNumber}`,
          },
        });
      }


      // Mark the sale as cancelled
      const cancelledSale = await tx.sale.update({
        where: { id: id },
        data: { isCancelled: true },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
          cashRegisterSession: true,
        },
      });

      // Create reversing cash movements for each payment if there's an active session
      if (cancelledSale.cashRegisterSessionId) {
        const currentRate = await exchangeRateService.getCurrentExchangeRate();
        for (const payment of cancelledSale.payments) {
          await tx.cashMovement.create({
            data: {
              cashRegisterSessionId: cancelledSale.cashRegisterSessionId,
              saleId: cancelledSale.id,
              type: 'anulacion',
              amountUsd: -payment.amount,
              amountBs: -(payment.amount * (currentRate?.rate || 1)), // Use negative to reverse
              paymentMethod: payment.method,
              description: `REVERSA: Anulación de Venta #${cancelledSale.ticketNumber} (${payment.method})`,
            },
          });
        }
      }

      return cancelledSale;
    });
  }

  /**
   * Check if a payment reference already exists for today
   * Used to prevent duplicate references for Pago Móvil and Transferencia
   */
  async checkDuplicateReference(reference: string, paymentMethods: string[]): Promise<{ isDuplicate: boolean; existingTicket?: string }> {
    if (!reference || reference.trim() === '') {
      return { isDuplicate: false };
    }

    // Get start and end of today in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find any payment with the same reference today
    const existingPayment = await prisma.payment.findFirst({
      where: {
        reference: reference.trim(),
        method: { in: paymentMethods },
        sale: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          isCancelled: false, // Ignore cancelled sales
        },
      },
      include: {
        sale: true,
      },
    });

    if (existingPayment) {
      return {
        isDuplicate: true,
        existingTicket: existingPayment.sale.ticketNumber,
      };
    }

    return { isDuplicate: false };
  }
}

export const saleService = new SaleService();
