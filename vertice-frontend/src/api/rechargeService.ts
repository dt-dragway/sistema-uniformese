import axiosInstance from './axiosInstance';

export interface RechargeServiceType {
    id: number;
    name: string;
    icon: string | null;
    isEnabled: boolean;
}

export interface Recharge {
    id: number;
    ticketNumber: string;
    serviceId: number;
    service: RechargeServiceType;
    phoneNumber: string;
    amountBs: number;
    commissionPercent: number;
    commissionBs: number;
    totalChargeBs: number;
    amountUsd: number;
    exchangeRate: number;
    cashRegisterSessionId: number;
    status: string;
    createdAt: string;
}

const getServices = () => {
    return axiosInstance.get<RechargeServiceType[]>('/recharge-services');
};

const getRecharges = (dateFrom?: string, dateTo?: string) => {
    return axiosInstance.get<Recharge[]>('/recharges', {
        params: { dateFrom, dateTo },
    });
};

const getRechargesBySession = (sessionId: number) => {
    return axiosInstance.get<Recharge[]>(`/recharges/session/${sessionId}`);
};

const createRecharge = (data: {
    serviceId: number;
    phoneNumber: string;
    amountBs: number;
    commissionPercent: number;
    cashRegisterSessionId: number;
}) => {
    return axiosInstance.post<Recharge>('/recharges', data);
};

const updateRechargeStatus = (id: number, status: string) => {
    return axiosInstance.patch<Recharge>(`/recharges/${id}/status`, { status });
};

const seedServices = () => {
    return axiosInstance.post('/recharge-services/seed');
};

const rechargeApi = {
    getServices,
    getRecharges,
    getRechargesBySession,
    createRecharge,
    updateRechargeStatus,
    seedServices,
};

export default rechargeApi;
