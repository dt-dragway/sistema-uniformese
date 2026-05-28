import { Request, Response } from 'express';
import { rechargeService } from '../services/RechargeService';

export const getServices = async (req: Request, res: Response) => {
    try {
        const services = await rechargeService.getServices();
        res.json(services);
    } catch (error) {
        console.error('Error fetching recharge services:', error);
        res.status(500).json({ message: 'Error fetching recharge services', error });
    }
};

export const getRecharges = async (req: Request, res: Response) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const recharges = await rechargeService.getAllRecharges(
            dateFrom ? new Date(dateFrom as string) : undefined,
            dateTo ? new Date(dateTo as string) : undefined
        );
        res.json(recharges);
    } catch (error) {
        console.error('Error fetching recharges:', error);
        res.status(500).json({ message: 'Error fetching recharges', error });
    }
};

export const getRechargesBySession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const recharges = await rechargeService.getRechargesBySession(parseInt(sessionId));
        res.json(recharges);
    } catch (error) {
        console.error('Error fetching recharges by session:', error);
        res.status(500).json({ message: 'Error fetching recharges', error });
    }
};

export const createRecharge = async (req: Request, res: Response) => {
    try {
        const { serviceId, phoneNumber, amountBs, commissionPercent, cashRegisterSessionId } = req.body;

        if (!serviceId || !phoneNumber || !amountBs || commissionPercent === undefined || !cashRegisterSessionId) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }

        const recharge = await rechargeService.createRecharge({
            serviceId,
            phoneNumber,
            amountBs,
            commissionPercent,
            cashRegisterSessionId,
        });

        res.status(201).json(recharge);
    } catch (error) {
        console.error('Error creating recharge:', error);
        res.status(500).json({ message: 'Error creating recharge', error });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ message: 'ID and status are required' });
        }

        const recharge = await rechargeService.updateStatus(parseInt(id), status);
        res.json(recharge);
    } catch (error) {
        console.error('Error updating recharge status:', error);
        res.status(500).json({ message: 'Error updating recharge status', error });
    }
};

export const seedServices = async (req: Request, res: Response) => {
    try {
        const result = await rechargeService.seedServices();
        res.json(result);
    } catch (error) {
        console.error('Error seeding services:', error);
        res.status(500).json({ message: 'Error seeding services', error });
    }
};
