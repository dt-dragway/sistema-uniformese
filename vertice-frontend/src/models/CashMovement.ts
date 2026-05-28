export interface CashMovement {
  id: number;
  cashRegisterId: number;
  type: string;
  amount: number;
  amountBs: number;
  amountUsd: number;
  paymentMethod?: string;
  description?: string;
  timestamp: string;
  saleId?: number;
  cashRegister: { name: string };
}
