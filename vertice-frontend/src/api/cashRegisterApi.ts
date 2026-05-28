import { API_URL as API_BASE_URL } from './axiosInstance';

export interface CashRegister {
  id: number;
  name: string;
  openingBalance: number;
  closingBalance: number | null;
  isOpen: boolean;
  openedAt: string;
  closedAt: string | null;
  movements: CashMovement[];
}

export interface CashMovement {
  id: number;
  cashRegisterId: number;
  type: 'deposit' | 'withdrawal' | 'sale' | 'refund' | 'avance_salida' | 'avance_entrada';
  amount: number;
  amountBs: number;
  paymentMethod?: string;
  description?: string;
  timestamp: string;
}

export interface OpenCashRegisterData {
  name: string;
  openingBalance: number;
}

export interface AddCashMovementData {
  type: 'deposit' | 'withdrawal' | 'sale' | 'refund';
  amount: number;
  description?: string;
}

export const getAllCashRegisters = async (): Promise<CashRegister[]> => {
  const response = await fetch(`${API_BASE_URL}/cash-registers`);
  if (!response.ok) {
    throw new Error('Failed to fetch cash registers');
  }
  return response.json();
};

export const getCashRegisterById = async (id: number): Promise<CashRegister | null> => {
  const response = await fetch(`${API_BASE_URL}/cash-registers/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch cash register');
  }
  return response.json();
};

export const openCashRegister = async (data: OpenCashRegisterData): Promise<CashRegister> => {
  const response = await fetch(`${API_BASE_URL}/cash-registers/open`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to open cash register');
  }
  return response.json();
};

export const closeCashRegister = async (id: number): Promise<CashRegister | null> => {
  const response = await fetch(`${API_BASE_URL}/cash-registers/${id}/close`, {
    method: 'POST',
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to close cash register');
  }
  return response.json();
};

export const addCashMovement = async (cashRegisterId: number, data: AddCashMovementData): Promise<CashMovement> => {
  const response = await fetch(`${API_BASE_URL}/cash-registers/${cashRegisterId}/movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to add cash movement');
  }
  return response.json();
};

export const getCashRegisterMovements = async (id: number): Promise<CashMovement[]> => {
  const response = await fetch(`${API_BASE_URL}/cash-registers/${id}/movements`);
  if (!response.ok) {
    throw new Error('Failed to fetch cash register movements');
  }
  return response.json();
};
