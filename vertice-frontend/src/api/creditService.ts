import axiosInstance from './axiosInstance';

export const addCredit = async (customerId: number, amount: number, description: string, paymentMethod: string, reference?: string) => {
  const response = await axiosInstance.post(`/customers/${customerId}/credit`, {
    amount,
    description,
    paymentMethod,
    reference,
  });
  return response.data;
};

export const getCreditPayments = async (customerId?: number) => {
  const params = customerId ? { customerId } : {};
  const response = await axiosInstance.get('/credits', { params });
  return response.data;
};
