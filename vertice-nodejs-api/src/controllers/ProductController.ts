import { Request, Response } from 'express';
import { productService } from '../services/ProductService';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).send('Error fetching products');
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid product ID');
    }
    const product = await productService.getProductById(id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching product');
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const newProduct = req.body;
    const product = await productService.createProduct(newProduct);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).send('Error creating product');
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid product ID');
    }
    const updatedFields = req.body;
    const product = await productService.updateProduct(id, updatedFields);
    if (product) {
      res.json(product);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    res.status(500).send('Error updating product');
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }
    const result = await productService.deleteProduct(id);
    if (result.success) {
      res.status(204).send(); // No Content
    } else {
      res.status(400).json({ message: result.error || 'No se pudo eliminar el producto' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const products = await productService.getLowStockProducts();
    res.json(products);
  } catch (error) {
    res.status(500).send('Error fetching low stock products');
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  try {
    const { barCode } = req.params;
    const product = await productService.getProductByBarcode(barCode);
    if (product) {
      res.json(product);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching product by barcode');
  }
};

export const getMostSoldProducts = async (req: Request, res: Response) => {
  try {
    const products = await productService.getMostSoldProducts();
    res.json(products);
  } catch (error) {
    res.status(500).send('Error fetching most sold products');
  }
};
