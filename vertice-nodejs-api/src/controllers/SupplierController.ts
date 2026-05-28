import { Request, Response } from 'express';
import { supplierService } from '../services/SupplierService';

export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await supplierService.getAllSuppliers();
    res.json(suppliers);
  } catch (error) {
    res.status(500).send('Error fetching suppliers');
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid supplier ID');
    }
    const supplier = await supplierService.getSupplierById(id);
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).send('Supplier not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching supplier');
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const newSupplier = req.body;
    const supplier = await supplierService.createSupplier(newSupplier);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).send('Error creating supplier');
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid supplier ID');
    }
    const updatedFields = req.body;
    const supplier = await supplierService.updateSupplier(id, updatedFields);
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).send('Supplier not found');
    }
  } catch (error) {
    res.status(500).send('Error updating supplier');
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid supplier ID');
    }
    const deleted = await supplierService.deleteSupplier(id);
    if (deleted) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).send('Supplier not found');
    }
  } catch (error) {
    res.status(500).send('Error deleting supplier');
  }
};
