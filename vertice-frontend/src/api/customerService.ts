import axiosInstance from './axiosInstance';
import { Customer } from '../models/Customer';

const getAllCustomers = () => {
  return axiosInstance.get<Customer[]>('/customers');
};

const getCustomerById = (id: number) => {
  return axiosInstance.get<Customer>(`/customers/${id}`);
};

const createCustomer = (customer: Omit<Customer, 'id'>) => {
  return axiosInstance.post<Customer>('/customers', customer);
};

const updateCustomer = (id: number, customer: Partial<Customer>) => {
  return axiosInstance.put<Customer>(`/customers/${id}`, customer);
};

const deleteCustomer = (id: number) => {
  return axiosInstance.delete(`/customers/${id}`);
};

export default {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
