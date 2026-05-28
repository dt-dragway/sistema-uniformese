import { fetchWithAuth } from './axiosInstance';

export interface Customer {
  id: number;
  cedula: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  currentCredit: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPayment {
  id: number;
  customerId: number;
  amount: number;
  paymentDate: string;
  description?: string;
}

export interface CreateCustomerData {
  cedula: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
}

export interface UpdateCustomerData {
  cedula?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
}

export interface CreateCreditPaymentData {
  amount: number;
  description?: string;
}

export const getAllCustomers = async (): Promise<Customer[]> => {
  const response = await fetchWithAuth('/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
};

export const getCustomerById = async (id: number): Promise<Customer | null> => {
  const response = await fetchWithAuth(`/customers/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch customer');
  }
  return response.json();
};

export const createCustomer = async (data: CreateCustomerData): Promise<Customer> => {
  const response = await fetchWithAuth('/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create customer');
  }
  return response.json();
};

export const updateCustomer = async (id: number, data: UpdateCustomerData): Promise<Customer | null> => {
  const response = await fetchWithAuth(`/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to update customer');
  }
  return response.json();
};

export const deleteCustomer = async (id: number): Promise<boolean> => {
  const response = await fetchWithAuth(`/customers/${id}`, {
    method: 'DELETE',
  });
  if (response.status === 204) {
    return true;
  }
  if (response.status === 404) {
    return false;
  }
  throw new Error('Failed to delete customer');
};

export const createCreditPayment = async (
  customerId: number,
  data: CreateCreditPaymentData
): Promise<CreditPayment> => {
  const response = await fetchWithAuth(`/customers/${customerId}/credit-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create credit payment');
  }
  return response.json();
};

export const getCustomerCreditPayments = async (customerId: number): Promise<CreditPayment[]> => {
  const response = await fetchWithAuth(`/customers/${customerId}/credit-payments`);
  if (!response.ok) {
    throw new Error('Failed to fetch credit payments');
  }
  return response.json();
};
