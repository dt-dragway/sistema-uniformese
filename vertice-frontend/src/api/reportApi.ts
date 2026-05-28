import { fetchWithAuth } from './axiosInstance';

export const exportSalesCsv = async (): Promise<Blob> => {
  const response = await fetchWithAuth('/reports/sales/export-csv');
  if (!response.ok) {
    throw new Error('Failed to export sales CSV');
  }
  return response.blob();
};
