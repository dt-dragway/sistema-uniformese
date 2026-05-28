import { Request, Response } from 'express';
import { merchandiseEntryService } from '../services/MerchandiseEntryService';

export const createMerchandiseEntry = async (req: Request, res: Response) => {
  try {
    const newEntry = req.body;
    const entry = await merchandiseEntryService.createEntry(newEntry);
    if (entry) {
      res.status(201).json(entry);
    } else {
      res.status(400).send('Product not found or invalid data');
    }
  } catch (error) {
    res.status(500).send('Error creating merchandise entry');
  }
};

export const getAllMerchandiseEntries = async (req: Request, res: Response) => {
  try {
    const entries = await merchandiseEntryService.getAllEntries();
    res.json(entries);
  } catch (error) {
    res.status(500).send('Error fetching merchandise entries');
  }
};

export const getMerchandiseEntryById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send('Invalid entry ID');
    }
    const entry = await merchandiseEntryService.getEntryById(id);
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).send('Merchandise entry not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching merchandise entry');
  }
};
