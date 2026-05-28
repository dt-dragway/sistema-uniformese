import axios from 'axios';
import { Customer } from '../models/Customer';
import { API_URL } from './axiosInstance';

const getAllCustomers = () => {
  return axios.get<Customer[]>(`${API_URL}/customers`);
};

const getCustomerById = (id: number) => {
  return axios.get<Customer>(`${API_URL}/customers/${id}`);
};

const createCustomer = (customer: Omit<Customer, 'id'>) => {
  return axios.post<Customer>(`${API_URL}/customers`, customer);
};

const updateCustomer = (id: number, customer: Partial<Customer>) => {
  return axios.put<Customer>(`${API_URL}/customers/${id}`, customer);
};

const deleteCustomer = (id: number) => {
  return axios.delete(`${API_URL}/customers/${id}`);
};

export default {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
