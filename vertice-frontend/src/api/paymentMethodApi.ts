import { fetchWithAuth } from './axiosInstance';

export interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodData {
  name: string;
  type: string;
  isEnabled?: boolean;
}

export interface UpdatePaymentMethodData {
  name?: string;
  type?: string;
  isEnabled?: boolean;
}

export const getAllPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await fetchWithAuth('/payment-methods');
  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }
  return response.json();
};

export const getPaymentMethodById = async (id: number): Promise<PaymentMethod | null> => {
  const response = await fetchWithAuth(`/payment-methods/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch payment method');
  }
  return response.json();
};

export const createPaymentMethod = async (data: CreatePaymentMethodData): Promise<PaymentMethod> => {
  const response = await fetchWithAuth('/payment-methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create payment method');
  }
  return response.json();
};

export const updatePaymentMethod = async (id: number, data: UpdatePaymentMethodData): Promise<PaymentMethod | null> => {
  const response = await fetchWithAuth(`/payment-methods/${id}`, {
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
    throw new Error('Failed to update payment method');
  }
  return response.json();
};

export const deletePaymentMethod = async (id: number): Promise<boolean> => {
  const response = await fetchWithAuth(`/payment-methods/${id}`, {
    method: 'DELETE',
  });
  if (response.status === 204) {
    return true;
  }
  if (response.status === 404) {
    return false;
  }
  throw new Error('Failed to delete payment method');
};
