import { Request, Response } from 'express';
import * as creditService from '../services/CreditService';

export const addCredit = async (req: Request, res: Response) => {
  const customerId = parseInt(req.params.id, 10);
  const { amount, description, paymentMethod, reference } = req.body;

  if (isNaN(customerId) || !amount || !paymentMethod) {
    return res.status(400).json({ message: 'Invalid input: customerId, amount, and paymentMethod are required.' });
  }

  try {
    const result = await creditService.addCreditPayment(customerId, amount, description, paymentMethod, reference);
    res.status(201).json(result);
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllCreditPayments = async (req: Request, res: Response) => {
  try {
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;
    const payments = await creditService.getAllCreditPayments(customerId);
    res.json(payments);
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};
