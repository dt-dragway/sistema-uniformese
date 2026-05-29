import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { clearVenta } from './cartSlice';
import salesService from '../api/salesService';

type QuickFilter = 'promotions' | 'favorites';

import { Sale } from '../models/Sale';

interface SalesState {
  sales: Sale[];
  searchTerm: string;
  quickFilter: QuickFilter | null;
  sortBy: string;
  selectedCustomer: number | null;
  submitting: boolean;
  loading: boolean;
  error: string | null;
  showSaleSuccessNotification: boolean;
  isCalculatorModalOpen: boolean;
}

const initialState: SalesState = {
  sales: [],
  searchTerm: '',
  quickFilter: null,
  sortBy: 'default',
  selectedCustomer: null,
  submitting: false,
  loading: false,
  error: null,
  showSaleSuccessNotification: false,
  isCalculatorModalOpen: false,
};

export const fetchSales = createAsyncThunk('sales/fetchSales', async (_, { rejectWithValue }) => {
  try {
    const response = await salesService.getSales();
    return response.data;
  } catch (error: any) {
    return rejectWithValue((error as any).response?.data?.message || (error as Error).message);
  }
});

export const submitSale = createAsyncThunk(
  'sales/submitSale',
  async (
    saleData: {
      items: { productId: number; quantity: number; price: number }[];
      payments: { method: string; amount: number; reference?: string }[];
      totalUsd: number;
      totalBs: number;
      customerId?: number;
      cashRegisterSessionId: number;
      activeVentaId: string; // Added to know which venta to clear
      pendingRecharges?: {
        serviceId: number;
        serviceName: string;
        phoneNumber: string;
        amountBs: number;
        commissionPercent: number;
        commissionBs: number;
        totalChargeBs: number;
      }[];
      pendingCashAdvances?: {
        amountToGive: number;
        commissionPercent: number;
        commissionBs: number;
        totalChargeBs: number;
        paymentMethod: string;
      }[];
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await salesService.createSale(saleData);
      // Clear both cart items AND customer selection
      dispatch(clearVenta(saleData.activeVentaId));
      dispatch(clearFilters());
      dispatch(setSaleSuccessNotification(true));
      return response.data;
    } catch (error: any) {
      return rejectWithValue((error as any).response?.data?.message || (error as Error).message);
    }
  }
);

export const cancelSale = createAsyncThunk(
  'sales/cancelSale',
  async ({ id, reason }: { id: number; reason: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await salesService.cancelSale(id, reason);
      await dispatch(fetchSales()); // Wait for sales to refetch before resolving
      return response.data;
    } catch (error: any) {
      return rejectWithValue((error as any).response?.data?.message || (error as Error).message);
    }
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setQuickFilter: (state, action: PayloadAction<QuickFilter | null>) => {
      state.quickFilter = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    clearFilters: (state) => {
      state.searchTerm = '';
      state.quickFilter = null;
      state.sortBy = 'default';
      state.selectedCustomer = null;
    },
    setSelectedCustomer: (state, action: PayloadAction<number | null>) => {
      state.selectedCustomer = action.payload;
    },
    setSaleSuccessNotification: (state, action: PayloadAction<boolean>) => {
      state.showSaleSuccessNotification = action.payload;
    },
    toggleCalculatorModal: (state) => {
      state.isCalculatorModalOpen = !state.isCalculatorModalOpen;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitSale.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitSale.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(submitSale.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string; // Error message from rejectWithValue
      })
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action: PayloadAction<Sale[]>) => {
        state.loading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelSale.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(cancelSale.fulfilled, (state) => {
        state.submitting = false;
        // Sales list is already refreshed by the thunk, this just updates the UI state
      })
      .addCase(cancelSale.rejected, (state, action) => {
        state.submitting = false;
        const errorMessage = action.payload as string;
        // Ignore "already cancelled" errors since the desired state is achieved
        if (!errorMessage?.includes('ya ha sido anulada')) {
          state.error = errorMessage;
        }
      });
  },
});

export const {
  setSearchTerm,
  setQuickFilter,
  setSortBy,
  clearFilters,
  setSelectedCustomer,
  setSaleSuccessNotification,
  toggleCalculatorModal,
} = salesSlice.actions;

export default salesSlice.reducer;
