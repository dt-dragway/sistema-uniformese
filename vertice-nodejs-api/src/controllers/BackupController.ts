import { Request, Response } from 'express';
import { backupService } from '../services/BackupService';
import path from 'path';
import fs from 'fs';

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const downloadBackup = async (req: Request, res: Response) => {
  try {
    const filePath = await backupService.createBackup();
    res.download(filePath, (err) => {
      // Eliminar el archivo temporal después de la descarga
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        console.error('Error during backup download:', err);
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreBackup = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo de respaldo.' });
    }

    const filePath = req.file.path;
    await backupService.restoreBackup(filePath);

    // Eliminar archivo subido después de restaurar
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: 'Base de datos restaurada con éxito. La aplicación se reiniciará.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
