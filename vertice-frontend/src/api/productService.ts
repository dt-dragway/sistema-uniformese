import axiosInstance from './axiosInstance';
import { Product } from '../models/Product';

const getAllProducts = () => {
  return axiosInstance.get<Product[]>('/products');
};

const getProductById = (id: number) => {
  return axiosInstance.get<Product>(`/products/${id}`);
};

const createProduct = (product: Omit<Product, 'id'>) => {
  return axiosInstance.post<Product>('/products', product);
};

const updateProduct = (id: number, product: Product) => {
  return axiosInstance.put<Product>(`/products/${id}`, product);
};

const deleteProduct = (id: number) => {
  return axiosInstance.delete(`/products/${id}`);
};

const getLowStockProducts = () => {
  return axiosInstance.get<Product[]>('/products/low-stock');
};

const getMostSoldProducts = () => {
  return axiosInstance.get<Product[]>('/products/by-sales');
};

const createInternalWithdrawal = (items: { productId: number; quantity: number }[], reason: string) => {
  return axiosInstance.post('/inventory/withdrawals', { items, reason });
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getMostSoldProducts,
  createInternalWithdrawal,
  getProductByBarcode: (barCode: string) => {
    return axiosInstance.get<Product>(`/products/barcode/${barCode}`);
  },
};
