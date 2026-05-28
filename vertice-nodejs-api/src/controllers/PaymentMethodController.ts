import { Request, Response } from 'express';
import { paymentMethodService } from '../services/PaymentMethodService';

export const getAllPaymentMethods = async (req: Request, res: Response) => {
  try {
    const methods = await paymentMethodService.getAllPaymentMethods();
    res.json(methods);
  } catch (error) {
    res.status(500).send('Error fetching payment methods');
  }
};

export const getPaymentMethodById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid ID');
    }
    const method = await paymentMethodService.getPaymentMethodById(id);
    if (method) {
      res.json(method);
    } else {
      res.status(404).send('Payment method not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching payment method');
  }
};

export const createPaymentMethod = async (req: Request, res: Response) => {
  try {
    const newMethod = req.body;
    const method = await paymentMethodService.createPaymentMethod(newMethod);
    res.status(201).json(method);
  } catch (error) {
    res.status(500).send('Error creating payment method');
  }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid ID');
    }
    const updatedFields = req.body;
    const method = await paymentMethodService.updatePaymentMethod(id, updatedFields);
    if (method) {
      res.json(method);
    } else {
      res.status(404).send('Payment method not found');
    }
  } catch (error) {
    res.status(500).send('Error updating payment method');
  }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid ID');
    }
    const deleted = await paymentMethodService.deletePaymentMethod(id);
    if (deleted) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).send('Payment method not found');
    }
  } catch (error) {
    res.status(500).send('Error deleting payment method');
  }
};
