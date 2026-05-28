import { Request, Response } from 'express';
import { CashRegisterService } from '../services/CashRegisterService';
import { getUserIdFromRequest, isAdmin, AuthRequest } from '../utils/utils';

const cashRegisterService = new CashRegisterService();

export const open = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const { openingAmountUsd, openingAmountBs } = req.body;
    if (typeof openingAmountUsd !== 'number' || typeof openingAmountBs !== 'number') {
      return res.status(400).json({ message: 'Los montos de apertura (USD y Bs) son requeridos y deben ser números.' });
    }
    const session = await cashRegisterService.openSession(userId, openingAmountUsd, openingAmountBs);
    res.status(201).json(session);
  } catch (error: any) {
    if (error.message.includes('activa')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al abrir la caja', error: error.message });
  }
};

export const close = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const { closingAmountUsd, closingAmountBs } = req.body;
    if (typeof closingAmountUsd !== 'number' || typeof closingAmountBs !== 'number') {
      return res.status(400).json({ message: 'Los montos de cierre (USD y Bs) son requeridos y deben ser números.' });
    }
    const session = await cashRegisterService.closeSession(userId, closingAmountUsd, closingAmountBs);
    res.status(200).json(session);
  } catch (error: any) {
    console.error('Error closing session:', error); // Debug log
    if (error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al cerrar la caja', error: error.message, stack: error.stack });
  }
};

// Nuevo: Admin puede cerrar la caja de cualquier cajero
export const closeByAdmin = async (req: Request, res: Response) => {
  try {
    const adminRequest = req as AuthRequest;
    if (!isAdmin(adminRequest)) {
      return res.status(403).json({ message: 'Solo administradores pueden cerrar cajas de otros usuarios' });
    }

    const { targetUserId, closingAmountUsd, closingAmountBs } = req.body;

    if (!targetUserId || typeof targetUserId !== 'number') {
      return res.status(400).json({ message: 'Se requiere el ID del usuario (targetUserId)' });
    }
    if (typeof closingAmountUsd !== 'number' || typeof closingAmountBs !== 'number') {
      return res.status(400).json({ message: 'Los montos de cierre (USD y Bs) son requeridos y deben ser números.' });
    }

    const session = await cashRegisterService.closeSession(targetUserId, closingAmountUsd, closingAmountBs);
    res.status(200).json(session);
  } catch (error: any) {
    console.error('Error closing session by admin:', error);
    if (error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al cerrar la caja', error: error.message });
  }
};

// Nuevo: Obtener todas las sesiones activas (para que admin pueda ver y cerrar)
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const adminRequest = req as AuthRequest;
    if (!isAdmin(adminRequest)) {
      return res.status(403).json({ message: 'Solo administradores pueden ver todas las sesiones activas' });
    }

    const sessions = await cashRegisterService.getAllActiveSessions();
    res.status(200).json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener sesiones activas', error: error.message });
  }
};

export const getClosingPreview = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const previewData = await cashRegisterService.getClosingPreview(userId);
    res.status(200).json(previewData);
  } catch (error: any) {
    if (error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al obtener la previsualización del cierre', error: error.message });
  }
};

// Nuevo: Preview de cierre para admin de un cajero específico
export const getClosingPreviewByAdmin = async (req: Request, res: Response) => {
  try {
    const adminRequest = req as AuthRequest;
    if (!isAdmin(adminRequest)) {
      return res.status(403).json({ message: 'Solo administradores pueden ver preview de otros usuarios' });
    }

    const targetUserId = parseInt(req.params.userId);
    if (!targetUserId) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const previewData = await cashRegisterService.getClosingPreview(targetUserId);
    res.status(200).json(previewData);
  } catch (error: any) {
    if (error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al obtener la previsualización del cierre', error: error.message });
  }
};

export const getActiveSession = async (req: Request, res: Response) => {
  console.log('Attempting to get active cash register session...');
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const session = await cashRegisterService.getActiveSession(userId);
    if (session) {
      res.status(200).json(session);
    } else {
      res.status(404).json({ message: 'No hay una sesión de caja activa para este usuario.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener la sesión activa', error: error.message });
  }
};

export const getAllCashMovements = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const adminRequest = req as AuthRequest;
    const userIsAdmin = isAdmin(adminRequest);

    const { startDate, endDate, type, ticketNumber } = req.query;
    const filters = {
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      type: type ? String(type) : undefined,
      ticketNumber: ticketNumber ? String(ticketNumber) : undefined,
    };

    // Si es admin, ve todos. Si es cajero, solo ve sus movimientos
    const movements = await cashRegisterService.getAllCashMovements(
      filters,
      userIsAdmin ? undefined : userId ?? undefined
    );
    res.status(200).json(movements);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener movimientos de caja', error: error.message });
  }
};

export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const adminRequest = req as AuthRequest;
    const userIsAdmin = isAdmin(adminRequest);

    // Si es admin, ve todas las sesiones. Si es cajero, solo ve las suyas
    const sessions = await cashRegisterService.getAllSessions(
      userIsAdmin ? undefined : userId ?? undefined
    );
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching cash register sessions', error: error.message });
  }
};

export const advance = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const { amountToGive, percentage, paymentMethod } = req.body;

    if (typeof amountToGive !== 'number' || typeof percentage !== 'number' || !paymentMethod) {
      return res.status(400).json({ message: 'Datos inválidos. Se requiere amountToGive (número), percentage (número) y paymentMethod (string).' });
    }

    const result = await cashRegisterService.processCashAdvance(userId, amountToGive, percentage, paymentMethod);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al procesar avance de efectivo', error: error.message });
  }
};

/**
 * CORTE X - Lectura Parcial (Solo consulta, NO modifica datos)
 */
export const getCorteX = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const corteX = await cashRegisterService.getCorteX(userId);
    res.status(200).json(corteX);
  } catch (error: any) {
    if (error.message.includes('sesión') || error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al generar Corte X', error: error.message });
  }
};

/**
 * CORTE X por Admin - Lee datos de otro usuario
 */
export const getCorteXByAdmin = async (req: Request, res: Response) => {
  try {
    const adminRequest = req as AuthRequest;
    if (!isAdmin(adminRequest)) {
      return res.status(403).json({ message: 'Solo administradores pueden ver Corte X de otros usuarios' });
    }

    const targetUserId = parseInt(req.params.userId);
    if (!targetUserId) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const corteX = await cashRegisterService.getCorteX(targetUserId);
    res.status(200).json(corteX);
  } catch (error: any) {
    if (error.message.includes('sesión') || error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al generar Corte X', error: error.message });
  }
};

/**
 * CORTE Z - Cierre de Caja (Transaccional)
 */
export const processCorteZ = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { conteoReal } = req.body;
    if (!conteoReal || typeof conteoReal.efectivoUsd !== 'number' || typeof conteoReal.efectivoBs !== 'number') {
      return res.status(400).json({
        message: 'Datos inválidos. Se requiere conteoReal con efectivoUsd y efectivoBs.'
      });
    }

    const result = await cashRegisterService.processCorteZ(userId, conteoReal, false);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('sesión') || error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al procesar Corte Z', error: error.message });
  }
};

/**
 * CORTE Z por Admin - Cierra caja de otro usuario
 */
export const processCorteZByAdmin = async (req: Request, res: Response) => {
  try {
    const adminRequest = req as AuthRequest;
    if (!isAdmin(adminRequest)) {
      return res.status(403).json({ message: 'Solo administradores pueden cerrar cajas de otros usuarios' });
    }

    const { targetUserId, conteoReal } = req.body;

    if (!targetUserId || typeof targetUserId !== 'number') {
      return res.status(400).json({ message: 'Se requiere el ID del usuario (targetUserId)' });
    }
    if (!conteoReal || typeof conteoReal.efectivoUsd !== 'number' || typeof conteoReal.efectivoBs !== 'number') {
      return res.status(400).json({
        message: 'Datos inválidos. Se requiere conteoReal con efectivoUsd y efectivoBs.'
      });
    }

    const result = await cashRegisterService.processCorteZ(targetUserId, conteoReal, true);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('sesión') || error.message.includes('abierta')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al procesar Corte Z', error: error.message });
  }
};