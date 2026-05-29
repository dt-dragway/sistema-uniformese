import axiosInstance from './axiosInstance';

interface InternalDispatchStats {
  totalValueUsd: number;
  totalValueBs: number;
  totalItems: number;
  movementCount: number;
  averageValueUsd: number;
  dailyData: { date: string; value: number }[];
  productData: { name: string; quantity: number; value: number }[];
}

const getStats = (startDate?: string, endDate?: string) => {
  return axiosInstance.get<InternalDispatchStats>('/reports/internal-dispatch', {
    params: { startDate, endDate },
  });
};

const internalReportService = {
  getStats,
};

export default internalReportService;
