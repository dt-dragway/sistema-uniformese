import { PrismaClient } from '@prisma/client';
import { exchangeRateService } from './ExchangeRateService';

const prisma = new PrismaClient();

export class CashRegisterService {
  public async openSession(userId: number, openingAmountUsd: number, openingAmountBs: number) {
    const existingSession = await prisma.cashRegisterSession.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
    });

    if (existingSession) {
      const openedDate = existingSession.openedAt.toLocaleString('es-VE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      throw new Error(
        `Ya existe una sesión de caja activa para este usuario. ` +
          `Sesión abierta el ${openedDate}. ` +
          `Por favor, cierre la sesión anterior antes de abrir una nueva.`
      );
    }

    return prisma.$transaction(async (tx) => {
      const newSession = await tx.cashRegisterSession.create({
        data: {
          userId,
          openingAmountUsd,
          openingAmountBs,
          status: 'OPEN',
        },
      });

      if (openingAmountUsd > 0) {
        await tx.cashMovement.create({
          data: {
            cashRegisterSessionId: newSession.id,
            type: 'apertura',
            amountUsd: openingAmountUsd,
            amountBs: 0,
            description: 'Monto inicial de apertura de caja (USD)',
          },
        });
      }

      if (openingAmountBs > 0) {
        await tx.cashMovement.create({
          data: {
            cashRegisterSessionId: newSession.id,
            type: 'apertura',
            amountUsd: 0,
            amountBs: openingAmountBs,
            description: 'Monto inicial de apertura de caja (Bs)',
          },
        });
      }

      return newSession;
    });
  }

  private async calculateSessionTotals(session: any) {
    const exchangeRate = await exchangeRateService.getCurrentExchangeRate();

    if (!exchangeRate) {
      throw new Error('No se pudo obtener la tasa de cambio actual. No se puede continuar con el cálculo.');
    }

    let calculatedCashSalesUsd = 0;
    let calculatedCashSalesBs = 0;
    let calculatedElectronicSalesBs = 0;
    let calculatedCreditSalesUsd = 0;
    let calculatedDebtPaymentsUsd = 0;
    let calculatedDebtPaymentsBs = 0;
    let calculatedOtherIncomeUsd = 0;
    let calculatedOtherIncomeBs = 0;
    let calculatedExpensesUsd = 0;
    let calculatedExpensesBs = 0;

    const sales = await prisma.sale.findMany({
      where: {
        cashRegisterSessionId: session.id,
        isCancelled: false,
      },
      include: {
        payments: true,
      },
    });

    for (const sale of sales) {
      const isCreditSale = sale.payments.some((p) => p.method === 'Crédito a Cliente');

      if (isCreditSale) {
        calculatedCreditSalesUsd += sale.totalUsd;
      } else {
        for (const payment of sale.payments) {
          const method = payment.method;
          if (method === 'Efectivo REF' || method === 'Efectivo $') {
            calculatedCashSalesUsd += payment.amount;
          } else if (method === 'Efectivo Bs.') {
            calculatedCashSalesBs += payment.amount * exchangeRate.rate;
          } else {
            calculatedElectronicSalesBs += payment.amount * exchangeRate.rate;
          }
        }

        const totalPaidInUsd = sale.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaidInUsd > sale.totalUsd) {
          const changeInUsd = totalPaidInUsd - sale.totalUsd;
          calculatedCashSalesUsd -= changeInUsd;
        }
      }
    }

    const creditPayments = await prisma.creditPayment.findMany({
      where: {
        cashRegisterSessionId: session.id,
      },
    });

    for (const debtPayment of creditPayments) {
      const method = debtPayment.paymentMethod.toLowerCase();
      if (method.includes('efectivo') && method.includes('bs')) {
        calculatedDebtPaymentsBs += debtPayment.amountBs;
      } else if (method.includes('efectivo')) {
        calculatedDebtPaymentsUsd += debtPayment.amount;
      } else {
        calculatedElectronicSalesBs += debtPayment.amountBs;
      }
    }

    const movements = await prisma.cashMovement.findMany({
      where: {
        cashRegisterSessionId: session.id,
      },
    });

    let totalAvanceSalidaBs = 0;
    let totalAvanceEntradaBs = 0;
    let totalRechargeIncomeBs = 0;

    for (const move of movements) {
      if (move.type === 'avance_salida') {
        totalAvanceSalidaBs += move.amountBs;
      } else if (move.type === 'avance_entrada') {
        totalAvanceEntradaBs += move.amountBs;
      } else if (move.type === 'recharge') {
        totalRechargeIncomeBs += move.amountBs;
      } else if (move.type === 'deposit') {
        calculatedOtherIncomeUsd += move.amountUsd;
        calculatedOtherIncomeBs += move.amountBs;
      } else if (move.type === 'withdrawal') {
        calculatedExpensesUsd += move.amountUsd;
        calculatedExpensesBs += move.amountBs;
      }
    }

    // Include recharges and advances in electronic totals for auditing
    calculatedElectronicSalesBs += totalAvanceEntradaBs + totalRechargeIncomeBs;

    return {
      calculatedCashSalesUsd,
      calculatedCashSalesBs,
      calculatedElectronicSalesBs,
      calculatedCreditSalesUsd,
      calculatedDebtPaymentsUsd,
      calculatedDebtPaymentsBs,
      calculatedOtherIncomeUsd,
      calculatedOtherIncomeBs,
      calculatedExpensesUsd,
      calculatedExpensesBs,
      totalAvanceSalidaBs,
      totalAvanceEntradaBs,
      totalRechargeIncomeBs,
      calculatedElectronicSalesUsd: 0,
    };
  }

  public async getClosingPreview(userId: number) {
    const session = await this.getActiveSession(userId);
    if (!session) {
      throw new Error('No se encontró una sesión de caja abierta para este usuario.');
    }

    const calculatedTotals = await this.calculateSessionTotals(session);

    const salesWithPayments = await prisma.sale.findMany({
      where: {
        cashRegisterSessionId: session.id,
        isCancelled: false,
      },
      include: {
        payments: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      ...session,
      ...calculatedTotals,
      sales: salesWithPayments,
    };
  }

  public async closeSession(userId: number, closingAmountUsd: number, closingAmountBs: number) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.cashRegisterSession.findFirst({
        where: { userId, status: 'OPEN' },
      });

      if (!session) {
        throw new Error('No se encontró una sesión de caja abierta para este usuario.');
      }

      const calculatedTotals = await this.calculateSessionTotals(session);

      const expectedAmountUsd =
        session.openingAmountUsd +
        calculatedTotals.calculatedCashSalesUsd +
        calculatedTotals.calculatedDebtPaymentsUsd -
        calculatedTotals.calculatedExpensesUsd;
      const expectedAmountBs =
        session.openingAmountBs +
        calculatedTotals.calculatedCashSalesBs +
        calculatedTotals.calculatedDebtPaymentsBs -
        calculatedTotals.calculatedExpensesBs -
        calculatedTotals.totalAvanceSalidaBs;

      const discrepancyUsd = closingAmountUsd - expectedAmountUsd;
      const discrepancyBs = closingAmountBs - expectedAmountBs;

      if (discrepancyUsd !== 0) {
        await tx.cashMovement.create({
          data: {
            cashRegisterSessionId: session.id,
            type: 'discrepancia',
            amountUsd: discrepancyUsd,
            description: discrepancyUsd > 0 ? 'Sobrante de caja (USD)' : 'Faltante de caja (USD)',
          },
        });
      }
      if (discrepancyBs !== 0) {
        await tx.cashMovement.create({
          data: {
            cashRegisterSessionId: session.id,
            type: 'discrepancia',
            amountBs: discrepancyBs,
            description: discrepancyBs > 0 ? 'Sobrante de caja (Bs)' : 'Faltante de caja (Bs)',
          },
        });
      }

      await tx.cashMovement.create({
        data: {
          cashRegisterSessionId: session.id,
          type: 'cierre',
          amountUsd: closingAmountUsd,
          amountBs: closingAmountBs,
          description: 'Monto de cierre de caja',
        },
      });

      return await tx.cashRegisterSession.update({
        where: { id: session.id },
        data: {
          closingAmountUsd,
          closingAmountBs,
          ...calculatedTotals,
          discrepancyUsd,
          discrepancyBs,
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });
    });
  }

  public async processCashAdvance(userId: number, amountToGive: number, percentage: number, paymentMethod: string) {
    const session = await this.getActiveSession(userId);
    if (!session) throw new Error('No hay una sesión de caja abierta.');

    const commissionBs = amountToGive * (percentage / 100);
    const totalChargeBs = amountToGive + commissionBs;

    return prisma.$transaction(async (tx) => {
      await tx.cashMovement.create({
        data: {
          cashRegisterSessionId: session.id,
          type: 'avance_salida',
          amountBs: amountToGive,
          amountUsd: 0,
          paymentMethod: 'Efectivo Bs.',
          description: `Avance: Entrega de efectivo (${percentage}% com.)`,
        },
      });

      await tx.cashMovement.create({
        data: {
          cashRegisterSessionId: session.id,
          type: 'avance_entrada',
          amountBs: totalChargeBs,
          amountUsd: 0,
          paymentMethod: paymentMethod,
          description: `Avance: Cobro electrónico (Monto + Comisión)`,
        },
      });

      return { success: true, amountGiven: amountToGive, totalCharged: totalChargeBs };
    });
  }

  public async recordServiceIncome(
    userId: number,
    amountUsd: number,
    amountBs: number,
    description: string,
    paymentMethod: string
  ) {
    const session = await this.getActiveSession(userId);
    if (!session) throw new Error('No hay una sesión de caja abierta.');

    return await prisma.cashMovement.create({
      data: {
        cashRegisterSessionId: session.id,
        type: 'deposit',
        paymentMethod: paymentMethod,
        amountUsd,
        amountBs,
        description: `Ingreso por Servicio/Arreglo: ${description}`,
      },
    });
  }

  public async getActiveSession(userId: number) {
    return prisma.cashRegisterSession.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
    });
  }

  public async getAllCashMovements(
    filters: { startDate?: string; endDate?: string; type?: string; ticketNumber?: string },
    userId?: number
  ) {
    const { startDate, endDate, type, ticketNumber } = filters;
    const where: any = {};

    if (userId) {
      where.cashRegisterSession = { userId: userId };
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      where.timestamp = { ...where.timestamp, gte: start };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      where.timestamp = { ...where.timestamp, lte: end };
    }
    if (type) where.type = type;

    return prisma.cashMovement.findMany({
      where,
      include: {
        cashRegisterSession: { include: { user: true } },
        sale: true,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  public async getAllSessions(userId?: number) {
    const where: any = {};
    if (userId) where.userId = userId;
    return prisma.cashRegisterSession.findMany({
      where,
      include: { user: true },
      orderBy: { openedAt: 'desc' },
    });
  }

  public async getAllActiveSessions() {
    return prisma.cashRegisterSession.findMany({
      where: { status: 'OPEN' },
      include: { user: true },
      orderBy: { openedAt: 'desc' },
    });
  }

  public async getCorteX(userId: number) {
    const session = await prisma.cashRegisterSession.findFirst({
      where: { userId, status: 'OPEN' },
      include: { user: true },
    });

    if (!session) throw new Error('No hay una sesión de caja abierta.');

    const exchangeRate = await exchangeRateService.getCurrentExchangeRate();
    if (!exchangeRate) throw new Error('No se pudo obtener la tasa de cambio.');

    const totals = await this.calculateSessionTotals(session);

    const totalEsperadoUsd =
      session.openingAmountUsd +
      totals.calculatedCashSalesUsd +
      totals.calculatedDebtPaymentsUsd -
      totals.calculatedExpensesUsd;
    const totalEsperadoBs =
      session.openingAmountBs +
      totals.calculatedCashSalesBs +
      totals.calculatedDebtPaymentsBs -
      totals.calculatedExpensesBs -
      totals.totalAvanceSalidaBs;

    const ventas = await prisma.sale.findMany({
      where: { cashRegisterSessionId: session.id, isCancelled: false },
    });

    return {
      sessionId: session.id,
      cajero: session.user.fullname || session.user.username,
      fechaApertura: session.openedAt,
      tasaCambio: exchangeRate.rate,
      apertura: {
        efectivoUsd: session.openingAmountUsd,
        efectivoBs: session.openingAmountBs,
      },
      totales: {
        efectivoUsd: totals.calculatedCashSalesUsd,
        efectivoBs: totals.calculatedCashSalesBs,
        electronicoBs: totals.calculatedElectronicSalesBs,
        creditoUsd: totals.calculatedCreditSalesUsd,
      },
      cobranzas: {
        efectivoUsd: totals.calculatedDebtPaymentsUsd,
        efectivoBs: totals.calculatedDebtPaymentsBs,
      },
      avances: {
        salidaBs: totals.totalAvanceSalidaBs,
        entradaBs: totals.totalAvanceEntradaBs,
      },
      gastos: {
        usd: totals.calculatedExpensesUsd,
        bs: totals.calculatedExpensesBs,
      },
      totalEsperado: {
        efectivoUsd: totalEsperadoUsd,
        efectivoBs: totalEsperadoBs,
        bancoBs: totals.calculatedElectronicSalesBs,
      },
      resumen: {
        totalVentasUsd: ventas.reduce((sum, v) => sum + v.totalUsd, 0),
        totalVentasBs: ventas.reduce((sum, v) => sum + v.totalBs, 0),
        cantidadVentas: ventas.length,
      },
    };
  }

  public async processCorteZ(
    userId: number,
    conteoReal: { efectivoUsd: number; efectivoBs: number },
    realizadoPorAdmin = false
  ) {
    const session = await prisma.cashRegisterSession.findFirst({
      where: { userId, status: 'OPEN' },
      include: { user: true },
    });

    if (!session) throw new Error('No hay una sesión de caja abierta.');

    return prisma.$transaction(async (tx) => {
      const totales = await this.calculateSessionTotals(session);

      const teoricoUsd =
        session.openingAmountUsd +
        totales.calculatedCashSalesUsd +
        totales.calculatedDebtPaymentsUsd -
        totales.calculatedExpensesUsd;
      const teoricoBs =
        session.openingAmountBs +
        totales.calculatedCashSalesBs +
        totales.calculatedDebtPaymentsBs -
        totales.calculatedExpensesBs -
        totales.totalAvanceSalidaBs;

      const discrepancyUsd = conteoReal.efectivoUsd - teoricoUsd;
      const discrepancyBs = conteoReal.efectivoBs - teoricoBs;

      const closedSession = await tx.cashRegisterSession.update({
        where: { id: session.id },
        data: {
          closingAmountUsd: conteoReal.efectivoUsd,
          closingAmountBs: conteoReal.efectivoBs,
          ...totales,
          discrepancyUsd,
          discrepancyBs,
          status: 'CLOSED',
          closedAt: new Date(),
        },
        include: { user: true },
      });

      await tx.cashMovement.create({
        data: {
          cashRegisterSessionId: session.id,
          type: 'cierre',
          amountUsd: conteoReal.efectivoUsd,
          amountBs: conteoReal.efectivoBs,
          description: realizadoPorAdmin ? 'Corte Z (Admin)' : 'Corte Z',
        },
      });

      return {
        sessionId: closedSession.id,
        cajero: closedSession.user.username,
        comparacion: {
          efectivoUsd: { teorico: teoricoUsd, real: conteoReal.efectivoUsd, diferencia: discrepancyUsd },
          efectivoBs: { teorico: teoricoBs, real: conteoReal.efectivoBs, diferencia: discrepancyBs },
        },
        totalesCalculados: totales,
        status: 'CLOSED',
      };
    });
  }
}
