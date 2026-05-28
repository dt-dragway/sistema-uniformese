import { Request, Response } from 'express';
import { inventoryService } from '../services/InventoryService';

export const getAllInventoryMovements = async (req: Request, res: Response) => {
  try {
    const movements = await inventoryService.getAllInventoryMovements();
    res.json(movements);
  } catch (error) {
    console.error('Error fetching all inventory movements:', error);
    res.status(500).send('Error fetching all inventory movements');
  }
};

export const getInventoryMovementsByProductId = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).send('Invalid product ID');
    }
    const movements = await inventoryService.getInventoryMovementsByProductId(productId);
    res.json(movements);
  } catch (error) {
    console.error(`Error fetching inventory movements for product ${req.params.productId}:`, error);
    res.status(500).send('Error fetching inventory movements for product');
  }
};

export const createMerchandiseEntry = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, cost, supplier } = req.body;
    if (!productId || !quantity || !cost) {
      return res.status(400).send('Missing required fields: productId, quantity, cost');
    }
    const entry = await inventoryService.createMerchandiseEntry(
      productId,
      quantity,
      cost,
      supplier
    );
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating merchandise entry:', error);
    res.status(500).send('Error creating merchandise entry');
  }
};

export const createInternalWithdrawal = async (req: Request, res: Response) => {
  try {
    const { items, reason } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).send('Invalid items data');
    }
    const result = await inventoryService.createInternalWithdrawal(items, reason || 'Consumo personal');
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating internal withdrawal:', error);
    res.status(500).send('Error creating internal withdrawal');
  }
};
