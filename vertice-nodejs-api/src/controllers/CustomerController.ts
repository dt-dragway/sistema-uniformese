import { Request, Response } from 'express';
import { customerService } from '../services/CustomerService';

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).send('Error fetching customers');
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid ID');
    }
    const customer = await customerService.getCustomerById(id);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching customer');
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { cedula, name, email, phone, address, creditLimit } = req.body;
    if (!cedula || !name || creditLimit === undefined) {
      return res.status(400).send('Cedula, name, and creditLimit are required.');
    }
    const newCustomer = {
      cedula: cedula.toUpperCase(),
      name: name.toUpperCase(),
      email,
      phone: phone?.toUpperCase(),
      address: address?.toUpperCase(),
      creditLimit
    };
    const customer = await customerService.createCustomer(newCustomer);
    res.status(201).json(customer);
  } catch (error: unknown) {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('cedula')) {
      return res.status(409).json({ message: 'A customer with this cedula already exists.' });
    }
    res.status(500).send('Error creating customer');
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid ID');
    }
    const updatedFields = req.body;
    if (updatedFields.name) {
      updatedFields.name = updatedFields.name.toUpperCase();
    }
    if (updatedFields.cedula) {
      updatedFields.cedula = updatedFields.cedula.toUpperCase();
    }
    if (updatedFields.phone) {
      updatedFields.phone = updatedFields.phone.toUpperCase();
    }
    if (updatedFields.address) {
      updatedFields.address = updatedFields.address.toUpperCase();
    }
    const customer = await customerService.updateCustomer(id, updatedFields);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (error: unknown) {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('cedula')) {
      return res.status(409).json({ message: 'A customer with this cedula already exists.' });
    }
    res.status(500).send('Error updating customer');
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid ID');
    }
    const deleted = await customerService.deleteCustomer(id);
    if (deleted) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        message: 'No se puede eliminar el cliente porque tiene facturas o abonos registrados. Considere anular su historial primero.' 
      });
    }
    res.status(500).json({ message: 'Error al intentar eliminar el cliente' });
  }
};
