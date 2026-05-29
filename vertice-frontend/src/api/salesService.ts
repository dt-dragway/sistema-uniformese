import axiosInstance from './axiosInstance';
import { Sale } from '../models/Sale';

interface SalePayload {
  items: { productId: number; quantity: number; price: number }[];
  payments: { method: string; amount: number; reference?: string }[];
  totalUsd: number;
  totalBs: number;
  customerId?: number;
  cashRegisterSessionId: number;
  pendingRecharges?: {
    serviceId: number;
    serviceName: string;
    phoneNumber: string;
    amountBs: number;
    commissionPercent: number;
    commissionBs: number;
    totalChargeBs: number;
  }[];
  pendingCashAdvances?: {
    amountToGive: number;
    commissionPercent: number;
    commissionBs: number;
    totalChargeBs: number;
    paymentMethod: string;
  }[];
}

const createSale = (saleData: SalePayload) => {
  return axiosInstance.post('/sales', saleData);
};

const getSales = () => {
  return axiosInstance.get<Sale[]>('/sales');
};

const cancelSale = (id: number, reason: string) => {
  return axiosInstance.post(`/sales/${id}/cancel`, { reason });
};

const getSaleByTicketNumber = (ticketNumber: string) => {
  return axiosInstance.get<Sale>(`/sales/ticket/${ticketNumber}`);
};

interface DuplicateReferenceResult {
  isDuplicate: boolean;
  existingTicket?: string;
}

const checkDuplicateReference = (reference: string, paymentMethods?: string[]) => {
  return axiosInstance.post<DuplicateReferenceResult>('/sales/check-reference', {
    reference,
    paymentMethods: paymentMethods || ['Pago Móvil', 'Transferencia'],
  });
};

const salesService = {
  createSale,
  getSales,
  cancelSale,
  getSaleByTicketNumber,
  checkDuplicateReference,
};

export default salesService;
