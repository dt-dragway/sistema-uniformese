import { PrismaClient } from '@prisma/client';
import { exchangeRateService } from './ExchangeRateService';

const prisma = new PrismaClient();

export const addCreditPayment = async (customerId: number, amount: number, description: string, paymentMethod: string, reference?: string) => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new Error('Customer not found');
  }

  const exchangeRate = await exchangeRateService.getCurrentExchangeRate();
  if (!exchangeRate) {
    throw new Error('Exchange rate not found');
  }

  const amountBs = amount * exchangeRate.rate;

  const newCreditPayment = await prisma.creditPayment.create({
    data: {
      customerId,
      amount,
      amountBs,
      exchangeRate: exchangeRate.rate,
      description,
      paymentMethod,
      reference,
    },
  });

  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      currentCredit: {
        increment: amount,
      },
    },
  });

  return { newCreditPayment, updatedCustomer };
};

export const getAllCreditPayments = async (customerId?: number) => {
  const whereClause = customerId ? { customerId } : {};

  const allMovements = await prisma.creditPayment.findMany({
    where: whereClause,
    orderBy: {
      paymentDate: 'asc', // Important: process in chronological order
    },
  });

  const charges = allMovements.filter((m) => m.amount > 0).map(m => ({ ...m, remaining: m.amount, status: 'Pendiente' }));
  const payments = allMovements.filter((m) => m.amount < 0).map(p => ({ ...p, available: -p.amount }));

  for (const charge of charges) {
    for (const payment of payments) {
      if (payment.available > 0 && charge.remaining > 0) {
        const amountToApply = Math.min(payment.available, charge.remaining);

        charge.remaining -= amountToApply;
        payment.available -= amountToApply;

        // Normalize very small values to zero to avoid floating point errors
        // Tolerance of 0.01 (1 centavo)
        if (Math.abs(charge.remaining) < 0.01) {
          charge.remaining = 0;
        }

        if (charge.remaining <= 0) { // Use <= instead of === for floating point comparison
          charge.status = 'Pagado';
          break;
        } else {
          charge.status = 'Parcialmente Pagado';
        }
      }
    }
  }

  const movementsWithStatus = allMovements.map(movement => {
    if (movement.amount > 0) { // Only charges (positive amounts) get a status
      const chargeWithStatus = charges.find(c => c.id === movement.id);
      return { ...movement, status: chargeWithStatus?.status, remaining: chargeWithStatus?.remaining };
    }
    return movement; // Payments (negative amounts) don't get a status
  });

  return movementsWithStatus.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
};
