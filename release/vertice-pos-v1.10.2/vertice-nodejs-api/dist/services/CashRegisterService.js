"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegisterService = void 0;
const client_1 = require("@prisma/client");
const ExchangeRateService_1 = require("./ExchangeRateService"); // Import the exchangeRateService
const prisma = new client_1.PrismaClient();
class CashRegisterService {
    openSession(userId, openingAmountUsd, openingAmountBs) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingSession = yield prisma.cashRegisterSession.findFirst({
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
                throw new Error(`Ya existe una sesión de caja activa para este usuario. ` +
                    `Sesión abierta el ${openedDate}. ` +
                    `Por favor, cierre la sesión anterior antes de abrir una nueva.`);
            }
            return prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const newSession = yield tx.cashRegisterSession.create({
                    data: {
                        userId,
                        openingAmountUsd,
                        openingAmountBs,
                        status: 'OPEN',
                    },
                });
                // Record opening cash movements for both currencies
                if (openingAmountUsd > 0) {
                    yield tx.cashMovement.create({
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
                    yield tx.cashMovement.create({
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
            }));
        });
    }
    calculateSessionTotals(session) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Fetch all payment methods and the current exchange rate
            const paymentMethods = yield prisma.paymentMethod.findMany();
            const creditPaymentMethod = paymentMethods.find(pm => pm.type === 'credit');
            const exchangeRate = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
            if (!exchangeRate) {
                throw new Error('No se pudo obtener la tasa de cambio actual. No se puede continuar con el cálculo.');
            }
            // 2. Initialize calculation variables
            let calculatedCashSalesUsd = 0;
            let calculatedCashSalesBs = 0;
            let calculatedElectronicSalesBs = 0;
            let calculatedCreditSalesUsd = 0;
            let calculatedDebtPaymentsUsd = 0;
            let calculatedDebtPaymentsBs = 0;
            let calculatedElectronicSalesUsd = 0; // Initialize unused ones to 0
            let calculatedOtherIncomeUsd = 0;
            let calculatedOtherIncomeBs = 0;
            let calculatedExpensesUsd = 0;
            let calculatedExpensesBs = 0;
            // 3. Process sales from the current session
            const sales = yield prisma.sale.findMany({
                where: {
                    cashRegisterSessionId: session.id,
                    isCancelled: false,
                },
                include: {
                    payments: true,
                },
            });
            for (const sale of sales) {
                // Check if the sale was on credit
                const isCreditSale = sale.payments.some(p => p.method === (creditPaymentMethod === null || creditPaymentMethod === void 0 ? void 0 : creditPaymentMethod.name) || p.method === 'Crédito a Cliente');
                if (isCreditSale) {
                    calculatedCreditSalesUsd += sale.totalUsd;
                }
                else {
                    // Process regular payments
                    for (const payment of sale.payments) {
                        if (payment.method === 'Efectivo $') {
                            calculatedCashSalesUsd += payment.amount;
                        }
                        else if (payment.method === 'Efectivo Bs.') {
                            // Payment amount for Efectivo Bs. is ALREADY in Bs, do NOT multiply by rate
                            calculatedCashSalesBs += payment.amount;
                        }
                        else {
                            // For other methods, payment.amount is in USD, convert to Bs
                            calculatedElectronicSalesBs += payment.amount * exchangeRate.rate;
                        }
                    }
                }
            }
            // 4. Process credit payments (Cobranza) made during the session
            const creditPayments = yield prisma.creditPayment.findMany({
                where: {
                    paymentDate: {
                        gte: session.openedAt,
                        lt: new Date(), // Use current time as the end point for an open session
                    },
                },
            });
            for (const debtPayment of creditPayments) {
                const method = debtPayment.paymentMethod.toLowerCase();
                if (method.includes('efectivo') && method.includes('bs')) {
                    calculatedDebtPaymentsBs += debtPayment.amountBs;
                }
                else if (method.includes('efectivo') && (method.includes('$') || method.includes('usd') || method.includes('dolar'))) {
                    calculatedDebtPaymentsUsd += debtPayment.amount;
                }
                else if (method === 'efectivo') {
                    // Fallback: if it just says 'Efectivo', assume Bs if amountBs > 0
                    if (debtPayment.amountBs > 0)
                        calculatedDebtPaymentsBs += debtPayment.amountBs;
                    else
                        calculatedDebtPaymentsUsd += debtPayment.amount;
                }
                else {
                    // Any other method (Pago Movil, Transferencia, etc)
                    calculatedElectronicSalesBs += debtPayment.amountBs;
                }
            }
            // 5. Process cash advances made during the session
            const advances = yield prisma.cashMovement.findMany({
                where: {
                    cashRegisterSessionId: session.id,
                    type: { in: ['avance_salida', 'avance_entrada'] },
                },
            });
            let totalAvanceSalidaBs = 0;
            let totalAvanceEntradaBs = 0;
            for (const move of advances) {
                if (move.type === 'avance_salida') {
                    totalAvanceSalidaBs += move.amountBs;
                }
                else if (move.type === 'avance_entrada') {
                    totalAvanceEntradaBs += move.amountBs;
                }
            }
            // Note: Avances are now tracked separately and applied in closing calculations
            // DO NOT subtract avanceSalidaBs from calculatedCashSalesBs here
            calculatedElectronicSalesBs += totalAvanceEntradaBs;
            return {
                calculatedCashSalesUsd,
                calculatedCashSalesBs,
                calculatedElectronicSalesBs,
                calculatedCreditSalesUsd,
                calculatedDebtPaymentsUsd,
                calculatedDebtPaymentsBs,
                totalAvanceSalidaBs,
                totalAvanceEntradaBs,
                calculatedElectronicSalesUsd,
                calculatedOtherIncomeUsd,
                calculatedOtherIncomeBs,
                calculatedExpensesUsd,
                calculatedExpensesBs,
            };
        });
    }
    getClosingPreview(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.getActiveSession(userId);
            if (!session) {
                throw new Error('No se encontró una sesión de caja abierta para este usuario.');
            }
            const calculatedTotals = yield this.calculateSessionTotals(session);
            // Also fetch the sales for the session to provide details on the frontend
            const salesWithPayments = yield prisma.sale.findMany({
                where: {
                    cashRegisterSessionId: session.id,
                    isCancelled: false,
                },
                include: {
                    payments: true,
                },
                orderBy: {
                    createdAt: 'asc',
                }
            });
            // Return the session data merged with the fresh calculations and detailed sales
            const closingPreview = Object.assign(Object.assign(Object.assign({}, session), calculatedTotals), { sales: salesWithPayments });
            return closingPreview;
        });
    }
    closeSession(userId, closingAmountUsd, closingAmountBs) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const session = yield tx.cashRegisterSession.findFirst({
                    where: { userId, status: 'OPEN' },
                });
                if (!session) {
                    throw new Error('No se encontró una sesión de caja abierta para este usuario.');
                }
                const calculatedTotals = yield this.calculateSessionTotals(session);
                // Expected PHYSICAL cash in drawer (USD and Bs)
                const expectedAmountUsd = session.openingAmountUsd + calculatedTotals.calculatedCashSalesUsd + calculatedTotals.calculatedDebtPaymentsUsd;
                // FOR Bs: We only expect physical cash (Opening + Cash Sales + Cash Debts - Avances Salida). 
                // We EXCLUDE Electronic Sales because that money is in the bank, not the drawer.
                // Avances de salida reduce the physical cash in drawer.
                const expectedAmountBs = session.openingAmountBs + calculatedTotals.calculatedCashSalesBs + calculatedTotals.calculatedDebtPaymentsBs - calculatedTotals.totalAvanceSalidaBs;
                const discrepancyUsd = closingAmountUsd - expectedAmountUsd;
                const discrepancyBs = closingAmountBs - expectedAmountBs;
                // Record discrepancies if any
                if (discrepancyUsd !== 0) {
                    yield tx.cashMovement.create({
                        data: {
                            cashRegisterSessionId: session.id,
                            type: 'discrepancia',
                            amountUsd: discrepancyUsd,
                            description: discrepancyUsd > 0 ? 'Sobrante de caja (USD)' : 'Faltante de caja (USD)',
                        },
                    });
                }
                if (discrepancyBs !== 0) {
                    yield tx.cashMovement.create({
                        data: {
                            cashRegisterSessionId: session.id,
                            type: 'discrepancia',
                            amountBs: discrepancyBs,
                            description: discrepancyBs > 0 ? 'Sobrante de caja (Bs)' : 'Faltante de caja (Bs)',
                        },
                    });
                }
                // Create 'cierre' cash movements
                yield tx.cashMovement.create({
                    data: {
                        cashRegisterSessionId: session.id,
                        type: 'cierre',
                        amountUsd: closingAmountUsd,
                        description: 'Monto de cierre de caja (USD)',
                    },
                });
                yield tx.cashMovement.create({
                    data: {
                        cashRegisterSessionId: session.id,
                        type: 'cierre',
                        amountBs: closingAmountBs,
                        description: 'Monto de cierre de caja (Bs)',
                    },
                });
                // Update the session with all new and old (zeroed out) values
                const updatedSession = yield tx.cashRegisterSession.update({
                    where: { id: session.id },
                    data: Object.assign(Object.assign({ closingAmountUsd,
                        closingAmountBs }, calculatedTotals), { discrepancyUsd,
                        discrepancyBs, status: 'CLOSED', closedAt: new Date() }),
                });
                return updatedSession;
            }));
        });
    }
    getActiveSession(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield prisma.cashRegisterSession.findFirst({
                where: {
                    userId,
                    status: 'OPEN',
                },
            });
            return session;
        });
    }
    addSaleToSession(sessionId, saleAmountUsd, saleAmountBs, paymentMethodType) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield prisma.cashRegisterSession.findUnique({ where: { id: sessionId } });
            if (!session) {
                throw new Error('Cash register session not found');
            }
            // Record the sale as a cash movement
            yield prisma.cashMovement.create({
                data: {
                    cashRegisterSessionId: sessionId,
                    type: 'venta',
                    amountUsd: saleAmountUsd,
                    amountBs: saleAmountBs,
                    description: `Venta (${paymentMethodType}) - USD: ${saleAmountUsd}, Bs: ${saleAmountBs}`,
                },
            });
            return session; // Return the session, updated sales will be calculated on close
        });
    }
    // Modificado: Ahora acepta userId opcional para filtrar por cajero
    getAllCashMovements(filters, userId // Si se proporciona, filtra solo movimientos de este usuario
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const { startDate, endDate, type, ticketNumber } = filters;
            const where = {};
            // Filtrar por usuario si se proporciona (para cajeros)
            if (userId) {
                where.cashRegisterSession = {
                    userId: userId
                };
            }
            if (startDate) {
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                where.timestamp = Object.assign(Object.assign({}, where.timestamp), { gte: start });
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                where.timestamp = Object.assign(Object.assign({}, where.timestamp), { lte: end });
            }
            if (type) {
                where.type = type;
            }
            if (ticketNumber) {
                where.sale = {
                    ticketNumber: {
                        contains: ticketNumber,
                        mode: 'insensitive'
                    }
                };
            }
            return prisma.cashMovement.findMany({
                where,
                include: {
                    cashRegisterSession: {
                        include: {
                            user: true
                        }
                    },
                    sale: true
                },
                orderBy: {
                    timestamp: 'desc',
                },
            });
        });
    }
    // Modificado: Ahora acepta userId opcional para filtrar por cajero
    getAllSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            // Si se proporciona userId, filtra solo las sesiones de ese usuario
            if (userId) {
                where.userId = userId;
            }
            return prisma.cashRegisterSession.findMany({
                where,
                include: {
                    user: true,
                },
                orderBy: {
                    openedAt: 'desc',
                },
            });
        });
    }
    // Nuevo: Obtener todas las sesiones ACTIVAS (para admin)
    getAllActiveSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.cashRegisterSession.findMany({
                where: {
                    status: 'OPEN',
                },
                include: {
                    user: true,
                },
                orderBy: {
                    openedAt: 'desc',
                },
            });
        });
    }
    processCashAdvance(userId, amountToGive, percentage, paymentMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.getActiveSession(userId);
            if (!session) {
                throw new Error('No hay una sesión de caja abierta para este usuario.');
            }
            const totalToCharge = amountToGive * (1 + percentage / 100);
            const profit = totalToCharge - amountToGive;
            return prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // 1. Withdrawal (Salida de Efectivo)
                yield tx.cashMovement.create({
                    data: {
                        cashRegisterSessionId: session.id,
                        type: 'avance_salida',
                        amountBs: amountToGive,
                        amountUsd: 0,
                        paymentMethod: 'Efectivo Bs.',
                        description: `Avance: Entrega de efectivo al cliente (${percentage}% com.)`,
                    },
                });
                // 2. Deposit (Ingreso Electrónico)
                yield tx.cashMovement.create({
                    data: {
                        cashRegisterSessionId: session.id,
                        type: 'avance_entrada',
                        amountBs: totalToCharge,
                        amountUsd: 0,
                        paymentMethod: paymentMethod,
                        description: `Avance: Cobro electrónico (Monto + Comisión ${profit.toFixed(2)} Bs)`,
                    },
                });
                return { success: true, amountGiven: amountToGive, totalCharged: totalToCharge, profit };
            }));
        });
    }
    /**
     * CORTE X - Lectura Parcial (Solo Consulta, NO modifica datos)
     * Genera un reporte de ventas agrupadas por método de pago
     */
    getCorteX(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield prisma.cashRegisterSession.findFirst({
                where: {
                    userId,
                    status: 'OPEN',
                },
                include: {
                    user: true,
                },
            });
            if (!session) {
                throw new Error('No hay una sesión de caja abierta para este usuario.');
            }
            const exchangeRate = yield ExchangeRateService_1.exchangeRateService.getCurrentExchangeRate();
            if (!exchangeRate) {
                throw new Error('No se pudo obtener la tasa de cambio actual.');
            }
            // 1. Obtener ventas agrupadas por método de pago
            const ventasPorMetodo = yield prisma.payment.groupBy({
                by: ['method'],
                where: {
                    sale: {
                        cashRegisterSessionId: session.id,
                        isCancelled: false,
                    },
                },
                _sum: {
                    amount: true,
                },
                _count: {
                    id: true,
                },
            });
            // 2. Obtener totales de ventas
            const ventas = yield prisma.sale.findMany({
                where: {
                    cashRegisterSessionId: session.id,
                    isCancelled: false,
                },
                include: {
                    payments: true,
                },
            });
            // 3. Calcular totales por tipo de pago
            let efectivoUsd = 0;
            let efectivoBs = 0;
            let pagoMovil = 0;
            let tarjetaDebito = 0;
            let tarjetaCredito = 0;
            let transferencia = 0;
            let creditoCliente = 0;
            let otros = 0;
            for (const venta of ventas) {
                for (const payment of venta.payments) {
                    const method = payment.method.toLowerCase();
                    if (method.includes('efectivo') && method.includes('$')) {
                        efectivoUsd += payment.amount;
                    }
                    else if (method.includes('efectivo') && method.includes('bs')) {
                        efectivoBs += payment.amount;
                    }
                    else if (method.includes('pago') && method.includes('móvil') || method.includes('movil')) {
                        pagoMovil += payment.amount;
                    }
                    else if (method.includes('débito') || method.includes('debito')) {
                        tarjetaDebito += payment.amount;
                    }
                    else if (method.includes('crédito') && method.includes('tarjeta')) {
                        tarjetaCredito += payment.amount;
                    }
                    else if (method.includes('transferencia')) {
                        transferencia += payment.amount;
                    }
                    else if (method.includes('crédito') && method.includes('cliente')) {
                        creditoCliente += payment.amount;
                    }
                    else {
                        otros += payment.amount;
                    }
                }
            }
            // 4. Obtener cobranzas de la sesión
            const cobranzas = yield prisma.creditPayment.findMany({
                where: {
                    paymentDate: {
                        gte: session.openedAt,
                    },
                },
            });
            let cobranzaEfectivoUsd = 0;
            let cobranzaEfectivoBs = 0;
            let cobranzaElectronico = 0;
            for (const cobro of cobranzas) {
                const method = cobro.paymentMethod.toLowerCase();
                if (method.includes('efectivo') && (method.includes('$') || method.includes('usd'))) {
                    cobranzaEfectivoUsd += cobro.amount;
                }
                else if (method.includes('efectivo')) {
                    cobranzaEfectivoBs += cobro.amountBs;
                }
                else {
                    cobranzaElectronico += cobro.amountBs;
                }
            }
            // 5. Obtener avances de efectivo
            const avances = yield prisma.cashMovement.findMany({
                where: {
                    cashRegisterSessionId: session.id,
                    type: { in: ['avance_salida', 'avance_entrada'] },
                },
            });
            let avanceSalidaBs = 0;
            let avanceEntradaBs = 0;
            for (const avance of avances) {
                if (avance.type === 'avance_salida') {
                    avanceSalidaBs += avance.amountBs;
                }
                else {
                    avanceEntradaBs += avance.amountBs;
                }
            }
            // 6. Calcular totales esperados en caja
            const totalEsperadoUsd = session.openingAmountUsd + efectivoUsd + cobranzaEfectivoUsd;
            const totalEsperadoBs = session.openingAmountBs + efectivoBs + cobranzaEfectivoBs - avanceSalidaBs;
            const totalElectronico = pagoMovil + tarjetaDebito + tarjetaCredito + transferencia + avanceEntradaBs + cobranzaElectronico;
            // 7. Construir respuesta del Corte X
            return {
                sessionId: session.id,
                cajero: session.user.username,
                fechaApertura: session.openedAt,
                tasaCambio: exchangeRate.rate,
                apertura: {
                    efectivoUsd: session.openingAmountUsd,
                    efectivoBs: session.openingAmountBs,
                },
                ventasPorMetodo: ventasPorMetodo.map((v) => ({
                    metodo: v.method,
                    total: v._sum.amount || 0,
                    cantidadTransacciones: v._count.id,
                })),
                detalleVentas: {
                    efectivoUsd,
                    efectivoBs,
                    pagoMovil,
                    tarjetaDebito,
                    tarjetaCredito,
                    transferencia,
                    creditoCliente,
                    otros,
                },
                cobranzas: {
                    efectivoUsd: cobranzaEfectivoUsd,
                    efectivoBs: cobranzaEfectivoBs,
                    electronico: cobranzaElectronico,
                },
                avances: {
                    salidaBs: avanceSalidaBs,
                    entradaBs: avanceEntradaBs,
                },
                totalEsperado: {
                    efectivoUsd: totalEsperadoUsd,
                    efectivoBs: totalEsperadoBs,
                    electronico: totalElectronico,
                },
                resumen: {
                    totalVentasUsd: ventas.reduce((sum, v) => sum + v.totalUsd, 0),
                    totalVentasBs: ventas.reduce((sum, v) => sum + v.totalBs, 0),
                    cantidadVentas: ventas.length,
                },
            };
        });
    }
    /**
     * CORTE Z - Cierre de Caja (Transaccional)
     * Compara teórico vs real y cierra la sesión atómicamente
     */
    processCorteZ(userId_1, conteoReal_1) {
        return __awaiter(this, arguments, void 0, function* (userId, conteoReal, realizadoPorAdmin = false) {
            // Obtener sesión activa
            const session = yield prisma.cashRegisterSession.findFirst({
                where: {
                    userId,
                    status: 'OPEN',
                },
                include: {
                    user: true,
                },
            });
            if (!session) {
                throw new Error('No hay una sesión de caja abierta para este usuario.');
            }
            // Ejecutar todo en una transacción atómica
            return prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // 1. Calcular totales teóricos
                const totales = yield this.calculateSessionTotals(session);
                // 2. Calcular efectivo teórico esperado
                const teoricoUsd = session.openingAmountUsd +
                    totales.calculatedCashSalesUsd +
                    totales.calculatedDebtPaymentsUsd;
                const teoricoBs = session.openingAmountBs +
                    totales.calculatedCashSalesBs +
                    totales.calculatedDebtPaymentsBs -
                    totales.totalAvanceSalidaBs;
                // 3. Calcular discrepancias (real - teórico)
                const discrepancyUsd = conteoReal.efectivoUsd - teoricoUsd;
                const discrepancyBs = conteoReal.efectivoBs - teoricoBs;
                // 4. Actualizar la sesión con todos los datos
                const closedSession = yield tx.cashRegisterSession.update({
                    where: { id: session.id },
                    data: {
                        closingAmountUsd: conteoReal.efectivoUsd,
                        closingAmountBs: conteoReal.efectivoBs,
                        calculatedCashSalesUsd: totales.calculatedCashSalesUsd,
                        calculatedCashSalesBs: totales.calculatedCashSalesBs,
                        calculatedElectronicSalesUsd: totales.calculatedElectronicSalesUsd,
                        calculatedElectronicSalesBs: totales.calculatedElectronicSalesBs,
                        calculatedCreditSalesUsd: totales.calculatedCreditSalesUsd,
                        calculatedDebtPaymentsUsd: totales.calculatedDebtPaymentsUsd,
                        calculatedDebtPaymentsBs: totales.calculatedDebtPaymentsBs,
                        calculatedOtherIncomeUsd: totales.calculatedOtherIncomeUsd,
                        calculatedOtherIncomeBs: totales.calculatedOtherIncomeBs,
                        calculatedExpensesUsd: totales.calculatedExpensesUsd,
                        calculatedExpensesBs: totales.calculatedExpensesBs,
                        totalAvanceSalidaBs: totales.totalAvanceSalidaBs,
                        totalAvanceEntradaBs: totales.totalAvanceEntradaBs,
                        discrepancyUsd,
                        discrepancyBs,
                        status: 'CLOSED',
                        closedAt: new Date(),
                    },
                    include: {
                        user: true,
                    },
                });
                // 5. Registrar movimiento de cierre
                yield tx.cashMovement.create({
                    data: {
                        cashRegisterSessionId: session.id,
                        type: 'cierre',
                        amountUsd: conteoReal.efectivoUsd,
                        amountBs: conteoReal.efectivoBs,
                        description: realizadoPorAdmin
                            ? `Corte Z realizado por administrador. Diferencia USD: ${discrepancyUsd.toFixed(2)}, Bs: ${discrepancyBs.toFixed(2)}`
                            : `Corte Z. Diferencia USD: ${discrepancyUsd.toFixed(2)}, Bs: ${discrepancyBs.toFixed(2)}`,
                    },
                });
                // 6. Generar observaciones
                let observaciones = '';
                if (discrepancyUsd === 0 && discrepancyBs === 0) {
                    observaciones = 'Cierre sin diferencias';
                }
                else {
                    const partes = [];
                    if (discrepancyUsd !== 0) {
                        partes.push(`${discrepancyUsd > 0 ? 'Sobrante' : 'Faltante'} de $${Math.abs(discrepancyUsd).toFixed(2)} USD`);
                    }
                    if (discrepancyBs !== 0) {
                        partes.push(`${discrepancyBs > 0 ? 'Sobrante' : 'Faltante'} de Bs. ${Math.abs(discrepancyBs).toFixed(2)}`);
                    }
                    observaciones = partes.join(', ');
                }
                // 7. Retornar resumen del cierre
                return {
                    sessionId: closedSession.id,
                    cajero: closedSession.user.username,
                    fechaApertura: closedSession.openedAt,
                    fechaCierre: closedSession.closedAt,
                    comparacion: {
                        efectivoUsd: {
                            teorico: teoricoUsd,
                            real: conteoReal.efectivoUsd,
                            diferencia: discrepancyUsd,
                        },
                        efectivoBs: {
                            teorico: teoricoBs,
                            real: conteoReal.efectivoBs,
                            diferencia: discrepancyBs,
                        },
                    },
                    totalesCalculados: totales,
                    status: 'CLOSED',
                    observaciones,
                    realizadoPorAdmin,
                };
            }));
        });
    }
}
exports.CashRegisterService = CashRegisterService;
