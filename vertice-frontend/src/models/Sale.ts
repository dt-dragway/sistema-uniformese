import { Customer } from './Customer';

export interface SaleItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

export interface Payment {
  id: number;
  method: string;
  amount: number;
  reference?: string;
}

export interface Sale {
  id: number;
  ticketNumber: string;
  items: SaleItem[];
  payments: Payment[];
  totalUsd: number;
  totalBs: number;
  isCancelled: boolean;
  createdAt: string;
  customer?: Customer;
}
