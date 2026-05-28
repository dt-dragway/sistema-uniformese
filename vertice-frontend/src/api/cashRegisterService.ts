import axiosInstance from './axiosInstance';
import { CashMovement } from '../models/CashMovement';
import { CashRegisterSession } from '../models/CashRegisterSession';

// Interfaces para Corte X y Z
export interface CorteXData {
  sessionId: number;
  cajero: string;
  fechaApertura: Date;
  tasaCambio: number;
  apertura: {
    efectivoUsd: number;
    efectivoBs: number;
  };
  ventasPorMetodo: Array<{
    metodo: string;
    total: number;
    cantidadTransacciones: number;
  }>;
  detalleVentas: {
    efectivoUsd: number;
    efectivoBs: number;
    pagoMovil: number;
    tarjetaDebito: number;
    tarjetaCredito: number;
    transferencia: number;
    creditoCliente: number;
    otros: number;
  };
  cobranzas: {
    efectivoUsd: number;
    efectivoBs: number;
    electronico: number;
  };
  avances: {
    salidaBs: number;
    entradaBs: number;
  };
  totalEsperado: {
    efectivoUsd: number;
    efectivoBs: number;
    electronico: number;
  };
  resumen: {
    totalVentasUsd: number;
    totalVentasBs: number;
    cantidadVentas: number;
  };
}

export interface CorteZData {
  sessionId: number;
  cajero: string;
  fechaApertura: Date;
  fechaCierre: Date;
  comparacion: {
    efectivoUsd: {
      teorico: number;
      real: number;
      diferencia: number;
    };
    efectivoBs: {
      teorico: number;
      real: number;
      diferencia: number;
    };
  };
  status: string;
  observaciones: string;
  realizadoPorAdmin: boolean;
}

const getAllCashMovements = (filters: {
  startDate?: string;
  endDate?: string;
  type?: string;
  ticketNumber?: string;
}) => {
  return axiosInstance.get<CashMovement[]>('/cash-movements', { params: filters });
};

const openSession = (openingAmountUsd: number, openingAmountBs: number) => {
  return axiosInstance.post<CashRegisterSession>('/cash-register/open', { openingAmountUsd, openingAmountBs });
};

const closeSession = (closingAmountUsd: number, closingAmountBs: number) => {
  return axiosInstance.post<CashRegisterSession>('/cash-register/close', { closingAmountUsd, closingAmountBs });
};

const closeSessionByAdmin = (targetUserId: number, closingAmountUsd: number, closingAmountBs: number) => {
  return axiosInstance.post<CashRegisterSession>('/cash-register/close-by-admin', {
    targetUserId,
    closingAmountUsd,
    closingAmountBs
  });
};

const getActiveSession = () => {
  return axiosInstance.get<CashRegisterSession>('/cash-register/status');
};

const getActiveSessions = () => {
  return axiosInstance.get<CashRegisterSession[]>('/cash-register/active-sessions');
};

const getAllSessions = () => {
  return axiosInstance.get<CashRegisterSession[]>('/cash-register/sessions');
};

const getClosingPreview = () => {
  return axiosInstance.get<CashRegisterSession>('/cash-register/preview');
};

const getClosingPreviewByAdmin = (userId: number) => {
  return axiosInstance.get<CashRegisterSession>(`/cash-register/preview/${userId}`);
};

const processCashAdvance = (amountToGive: number, percentage: number, paymentMethod: string) => {
  return axiosInstance.post('/cash-register/advance', { amountToGive, percentage, paymentMethod });
};

// ============= CORTE X (Lectura Parcial) =============

const getCorteX = () => {
  return axiosInstance.get<CorteXData>('/cash-register/corte-x');
};

const getCorteXByAdmin = (userId: number) => {
  return axiosInstance.get<CorteXData>(`/cash-register/corte-x/${userId}`);
};

// ============= CORTE Z (Cierre Transaccional) =============

const processCorteZ = (conteoReal: { efectivoUsd: number; efectivoBs: number }) => {
  return axiosInstance.post<CorteZData>('/cash-register/corte-z', { conteoReal });
};

const processCorteZByAdmin = (targetUserId: number, conteoReal: { efectivoUsd: number; efectivoBs: number }) => {
  return axiosInstance.post<CorteZData>('/cash-register/corte-z-admin', { targetUserId, conteoReal });
};

export default {
  getAllCashMovements,
  openSession,
  closeSession,
  closeSessionByAdmin,
  getActiveSession,
  getActiveSessions,
  getAllSessions,
  getClosingPreview,
  getClosingPreviewByAdmin,
  processCashAdvance,
  getCorteX,
  getCorteXByAdmin,
  processCorteZ,
  processCorteZByAdmin,
};