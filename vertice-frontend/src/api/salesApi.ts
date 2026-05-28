import { fetchWithAuth } from './axiosInstance';

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  price: number;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  totalUsd: number;
  totalBs: number;
  paymentMethodId: number;
  isCancelled: boolean;
  createdAt: string;
}

export interface TransactionAdjustment {
  id: number;
  saleId: number;
  type: 'return' | 'cancellation';
  reason: string;
  adjustedItems?: {
    productId: number;
    quantity: number;
  }[];
  amountRefunded?: number;
  timestamp: string;
}

export interface CancelSaleData {
  reason: string;
}

export interface CreateReturnData {
  reason: string;
  adjustedItems: { productId: number; quantity: number }[];
  amountRefunded?: number;
}

export const getAllSales = async (): Promise<Sale[]> => {
  const response = await fetchWithAuth('/sales');
  if (!response.ok) {
    throw new Error('Failed to fetch sales');
  }
  return response.json();
};

export const getSaleById = async (id: number): Promise<Sale | null> => {
  const response = await fetchWithAuth(`/sales/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch sale');
  }
  return response.json();
};

export const cancelSale = async (id: number, data: CancelSaleData): Promise<Sale | null> => {
  const response = await fetchWithAuth(`/sales/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to cancel sale');
  }
  return response.json();
};

export const createReturn = async (saleId: number, data: CreateReturnData): Promise<TransactionAdjustment> => {
  const response = await fetchWithAuth(`/sales/${saleId}/returns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create return');
  }
  return response.json();
};

export const getAllAdjustments = async (): Promise<TransactionAdjustment[]> => {
  const response = await fetchWithAuth('/adjustments');
  if (!response.ok) {
    throw new Error('Failed to fetch adjustments');
  }
  return response.json();
};

export const getAdjustmentById = async (id: number): Promise<TransactionAdjustment | null> => {
  const response = await fetchWithAuth(`/adjustments/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch adjustment');
  }
  return response.json();
};
