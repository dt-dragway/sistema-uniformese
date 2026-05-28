import { Request, Response } from 'express';
import { exchangeRateService } from '../services/ExchangeRateService';

export const getCurrentExchangeRate = async (req: Request, res: Response) => {
  try {
    const rate = await exchangeRateService.getCurrentExchangeRate();
    if (rate) {
      res.json(rate);
    } else {
      res.status(404).send('Exchange rate not set');
    }
  } catch (error) {
    res.status(500).send('Error fetching exchange rate');
  }
};

export const updateExchangeRate = async (req: Request, res: Response) => {
  try {
    const { rate } = req.body;
    if (rate === undefined || typeof rate !== 'number' || rate <= 0) {
      return res.status(400).send('Invalid exchange rate provided');
    }
    const updatedRate = await exchangeRateService.updateExchangeRate(rate);
    res.json(updatedRate);
  } catch (error) {
    res.status(500).send('Error updating exchange rate');
  }
};
