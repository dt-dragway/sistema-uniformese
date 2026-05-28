import axios from 'axios';
import { API_URL } from '../api/axiosInstance';

export const getSavedPrinter = async () => {
  const response = await axios.get(`${API_URL}/settings/printer`);
  return response.data;
};

export const savePrinter = async (printerName: string) => {
  const response = await axios.post(`${API_URL}/settings/printer`, { printerName });
  return response.data;
};

export const getCommissions = async () => {
  const response = await axios.get(`${API_URL}/settings/commissions`);
  return response.data;
};

export const saveCommissions = async (rechargeCommissionPercent?: number, cashAdvanceCommissionPercent?: number) => {
  const response = await axios.post(`${API_URL}/settings/commissions`, {
    rechargeCommissionPercent,
    cashAdvanceCommissionPercent,
  });
  return response.data;
};
