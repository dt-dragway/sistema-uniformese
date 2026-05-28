import axiosInstance from './axiosInstance';
import { Supplier } from '../models/Supplier';

const getAllSuppliers = () => {
  return axiosInstance.get<Supplier[]>('/suppliers');
};

const getSupplierById = (id: number) => {
  return axiosInstance.get<Supplier>(`/suppliers/${id}`);
};

const createSupplier = (supplier: Omit<Supplier, 'id'>) => {
  return axiosInstance.post<Supplier>('/suppliers', supplier);
};

const updateSupplier = (id: number, supplier: Partial<Supplier>) => {
  return axiosInstance.put<Supplier>(`/suppliers/${id}`, supplier);
};

const deleteSupplier = (id: number) => {
  return axiosInstance.delete(`/suppliers/${id}`);
};

export default {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
