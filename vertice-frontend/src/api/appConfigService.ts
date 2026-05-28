import axiosInstance from './axiosInstance';

const getCurrentExchangeRate = () => {
  return axiosInstance.get('/exchange-rate');
};

const updateExchangeRate = (rate: number) => {
  return axiosInstance.put('/exchange-rate', { rate });
};

const appConfigService = {
  getCurrentExchangeRate,
  updateExchangeRate,
};

export default appConfigService;
