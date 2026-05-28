export interface CreditPayment {
  id: number;
  customerId: number;
  amount: number;
  amountBs: number;
  exchangeRate: number;
  paymentDate: string;
  description: string | null;
  status?: 'Pagado' | 'Parcialmente Pagado' | 'Pendiente';
  remaining?: number;
}