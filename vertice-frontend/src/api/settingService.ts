import axiosInstance from '../api/axiosInstance';

export const getSavedPrinter = async () => {
  const response = await axiosInstance.get('/settings/printer');
  return response.data;
};

export const savePrinter = async (printerName: string) => {
  const response = await axiosInstance.post('/settings/printer', { printerName });
  return response.data;
};

export const getCommissions = async () => {
  const response = await axiosInstance.get('/settings/commissions');
  return response.data;
};

export const saveCommissions = async (rechargeCommissionPercent?: number, cashAdvanceCommissionPercent?: number) => {
  const response = await axiosInstance.post('/settings/commissions', {
    rechargeCommissionPercent,
    cashAdvanceCommissionPercent,
  });
  return response.data;
};
