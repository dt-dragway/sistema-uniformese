import { User } from './User';

export interface CashRegisterSession {
  id: number;
  userId: number;
  user: User; // Assuming you have a User model
  openingAmountUsd: number;
  openingAmountBs: number;
  closingAmountUsd: number | null;
  closingAmountBs: number | null;
  calculatedCashSalesUsd: number;
  calculatedCashSalesBs: number;
  calculatedElectronicSalesUsd: number;
  calculatedElectronicSalesBs: number;
  calculatedCreditSalesUsd: number;
  calculatedDebtPaymentsUsd: number;
  calculatedDebtPaymentsBs: number;
  calculatedOtherIncomeUsd: number;
  calculatedOtherIncomeBs: number;
  calculatedExpensesUsd: number;
  calculatedExpensesBs: number;
  totalAvanceSalidaBs?: number;
  totalAvanceEntradaBs?: number;
  discrepancyUsd: number;
  discrepancyBs: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string; // Using string to match what comes from JSON
  closedAt: string | null;
}
