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
  user?: {
    id: number;
    username: string;
    fullname: string | null;
  } | null;
}