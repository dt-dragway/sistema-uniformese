import { PrismaClient } from '@prisma/client';
import { exchangeRateService } from './ExchangeRateService';

const prisma = new PrismaClient();

export class RechargeService {
    async getServices() {
        return prisma.rechargeService.findMany({
            where: { isEnabled: true },
            orderBy: { name: 'asc' },
        });
    }

    async getAllRecharges(dateFrom?: Date, dateTo?: Date) {
        const where: any = {};

        if (dateFrom && dateTo) {
            where.createdAt = {
                gte: dateFrom,
                lte: dateTo,
            };
        }

        return prisma.recharge.findMany({
            where,
            include: {
                service: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getRechargesBySession(cashRegisterSessionId: number) {
        return prisma.recharge.findMany({
            where: { cashRegisterSessionId },
            include: { service: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createRecharge(data: {
        serviceId: number;
        phoneNumber: string;
        amountBs: number;
        commissionPercent: number;
        cashRegisterSessionId: number;
    }) {
        // Calcular comisión
        const commissionBs = data.amountBs * (data.commissionPercent / 100);
        const totalChargeBs = data.amountBs + commissionBs;

        // Obtener tasa de cambio
        const currentRate = await exchangeRateService.getCurrentExchangeRate();
        const rate = currentRate?.rate || 1;
        const amountUsd = totalChargeBs / rate;

        // Generar número de ticket
        const ticketNumber = await this.generateTicketNumber();

        // Crear la recarga
        const recharge = await prisma.recharge.create({
            data: {
                ticketNumber,
                serviceId: data.serviceId,
                phoneNumber: data.phoneNumber,
                amountBs: data.amountBs,
                commissionPercent: data.commissionPercent,
                commissionBs,
                totalChargeBs,
                amountUsd,
                exchangeRate: rate,
                cashRegisterSessionId: data.cashRegisterSessionId,
            },
            include: { service: true },
        });

        // Crear movimiento de caja
        await prisma.cashMovement.create({
            data: {
                cashRegisterSessionId: data.cashRegisterSessionId,
                type: 'recharge',
                amountUsd: amountUsd,
                amountBs: totalChargeBs,
                description: `Recarga ${recharge.service.name} - ${data.phoneNumber}`,
            },
        });

        return recharge;
    }

    async updateStatus(id: number, status: string) {
        return prisma.recharge.update({
            where: { id },
            data: { status },
            include: { service: true },
        });
    }

    private async generateTicketNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        const lastRecharge = await prisma.recharge.findFirst({
            where: {
                ticketNumber: { startsWith: `R${dateStr}` },
            },
            orderBy: { ticketNumber: 'desc' },
        });

        let sequence = 1;
        if (lastRecharge) {
            const lastSequence = parseInt(lastRecharge.ticketNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        return `R${dateStr}${sequence.toString().padStart(4, '0')}`;
    }

    async seedServices() {
        const services = [
            { name: 'Movistar Celular', icon: '📱' },
            { name: 'Movistar Fijo', icon: '📞' },
            { name: 'Digitel', icon: '📱' },
            { name: 'Movilnet', icon: '📱' },
            { name: 'CANTV', icon: '📞' },
            { name: 'Inter', icon: '🌐' },
            { name: 'SimpleTV', icon: '📺' },
        ];

        for (const service of services) {
            await prisma.rechargeService.upsert({
                where: { name: service.name },
                update: {},
                create: service,
            });
        }

        return { message: 'Services seeded successfully' };
    }
}

export const rechargeService = new RechargeService();
