import { Request, Response } from 'express';
import { saleService } from '../services/SaleService';
import { transactionAdjustmentService } from '../services/TransactionAdjustmentService';
import { AuthRequest } from '../utils/utils';

// Note: Most business logic has been moved to the service layer.
// The controller is responsible for request/response handling and basic validation.

export const getAllSales = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;

    let sales;
    if (userRole === 'ADMIN') {
      sales = await saleService.getAllSales();
    } else if (userId) {
      sales = await saleService.getSalesByUser(userId);
    } else {
      return res.status(401).json({ message: 'Usuario no identificado' });
    }
    
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales', error });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid sale ID');
    }
    const sale = await saleService.getSaleById(id);
    if (sale) {
      res.json(sale);
    } else {
      res.status(404).send('Sale not found');
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sale', error });
  }
};

export const getSaleByTicketNumber = async (req: Request, res: Response) => {
  try {
    const { ticketNumber } = req.params;
    if (!ticketNumber) {
      return res.status(400).send('Invalid ticket number');
    }
    const sale = await saleService.getSaleByTicketNumber(ticketNumber);
    if (sale) {
      res.json(sale);
    } else {
      res.status(404).send('Sale not found');
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sale', error });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const {
      items,
      payments,
      totalUsd,
      totalBs,
      customerId,
      cashRegisterSessionId,
      discount,
      discountType,
      discountValue,
      pendingRecharges,
      pendingCashAdvances,
    } = req.body;

    // Permitir ventas sin items si hay recargas o avances pendientes
    if (
      (!items || !Array.isArray(items) || items.length === 0) &&
      (!pendingRecharges || pendingRecharges.length === 0) &&
      (!pendingCashAdvances || pendingCashAdvances.length === 0)
    ) {
      return res.status(400).send('Invalid sale data: items, recharges or cash advances are required.');
    }
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).send('Invalid sale data: payments are required.');
    }
    if (cashRegisterSessionId === undefined) {
      return res.status(400).send('Invalid sale data: cashRegisterSessionId is required.');
    }

    const saleData = {
      items: items || [],
      payments,
      totalUsd,
      totalBs,
      customerId,
      cashRegisterSessionId,
      discount: discount || 0,
      discountType: discountType || null,
      discountValue: discountValue || 0,
    };

    const newSale = await saleService.createSale(saleData);
    res.status(201).json(newSale);
  } catch (error: unknown) {
    console.error('--- CREATE SALE ERROR ---', error); // Log the full error
    if (error instanceof Error) {
      if (error.message.includes('Insufficient stock')) {
        return res.status(400).json({ message: error.message });
      }
      // Send a more descriptive error message for other cases
      return res.status(400).json({ message: 'Error creating sale', error: error.message });
    }
    // Fallback for non-Error objects
    return res.status(400).json({ message: 'An unknown error occurred while creating the sale.' });
  }
};

export const cancelSale = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid sale ID');
    }
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).send('Cancellation reason is required');
    }

    const cancelledSale = await saleService.cancelSale(id);

    if (cancelledSale) {
      await transactionAdjustmentService.createAdjustment({
        saleId: id,
        type: 'cancellation',
        reason,
      });
      res.json(cancelledSale);
    } else {
      res.status(404).send('Sale not found or already cancelled');
    }
  } catch (error: any) {
    console.error('ERROR CANCELLING SALE:', error);
    if (error.message === 'Sale not found or already cancelled.') {
      return res.status(400).json({ message: 'Esta venta ya ha sido anulada o no existe.' });
    }
    res.status(500).json({ message: 'Error cancelling sale', error: error.message });
  }
};

// The other adjustment-related controller functions can remain as they are,
// as they primarily interact with the transactionAdjustmentService.

export const createReturn = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid sale ID');
    }
    const { reason, adjustedItems, amountRefunded } = req.body;

    if (!reason || !adjustedItems || !Array.isArray(adjustedItems)) {
      return res.status(400).send('Reason and adjusted items are required for return');
    }

    const adjustment = await transactionAdjustmentService.createAdjustment({
      saleId: id,
      type: 'return',
      reason,
      adjustedItems,
      amountRefunded,
    });

    res.status(201).json(adjustment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating return', error });
  }
};

export const getAllAdjustments = async (req: Request, res: Response) => {
  try {
    const adjustments = await transactionAdjustmentService.getAllAdjustments();
    res.json(adjustments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching adjustments', error });
  }
};

export const getAdjustmentById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid adjustment ID');
    }
    const adjustment = await transactionAdjustmentService.getAdjustmentById(id);
    if (adjustment) {
      res.json(adjustment);
    } else {
      res.status(404).send('Adjustment not found');
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching adjustment', error });
  }
};

/**
 * Check if a payment reference already exists for today
 * Used to prevent duplicate references for Pago Móvil and Transferencia
 */
export const checkDuplicateReference = async (req: Request, res: Response) => {
  try {
    const { reference, paymentMethods } = req.body;

    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ message: 'Reference is required' });
    }

    // Default to Pago Móvil and Transferencia if not specified
    const methods = paymentMethods || ['Pago Móvil', 'Transferencia'];

    const result = await saleService.checkDuplicateReference(reference, methods);
    res.json(result);
  } catch (error) {
    console.error('Error checking duplicate reference:', error);
    res.status(500).json({ message: 'Error checking reference', error });
  }
};
