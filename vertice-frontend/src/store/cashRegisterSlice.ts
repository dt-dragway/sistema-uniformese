import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CashMovement } from '../models/CashMovement';
import cashRegisterService from '../api/cashRegisterService';
import { CashRegisterSession } from '../models/CashRegisterSession';

interface CashRegisterState {
  currentSession: CashRegisterSession | null;
  sessions: CashRegisterSession[]; // Para el historial
  movements: CashMovement[];
  closingPreviewData: CashRegisterSession | null; // To hold the calculated data before closing
  loading: boolean;
  error: string | null;
}

const initialState: CashRegisterState = {
  currentSession: null,
  sessions: [],
  movements: [],
  closingPreviewData: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchClosingPreview = createAsyncThunk(
  'cashRegister/fetchClosingPreview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cashRegisterService.getClosingPreview();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchActiveSession = createAsyncThunk(
  'cashRegister/fetchActiveSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cashRegisterService.getActiveSession();
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const openCashRegister = createAsyncThunk(
  'cashRegister/openCashRegister',
  async (
    { openingAmountUsd, openingAmountBs }: { openingAmountUsd: number; openingAmountBs: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await cashRegisterService.openSession(openingAmountUsd, openingAmountBs);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const closeCashRegister = createAsyncThunk(
  'cashRegister/closeCashRegister',
  async (
    { closingAmountUsd, closingAmountBs }: { closingAmountUsd: number; closingAmountBs: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await cashRegisterService.closeSession(closingAmountUsd, closingAmountBs);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCashMovements = createAsyncThunk(
  'cashRegister/fetchCashMovements',
  async (
    filters: { startDate?: string; endDate?: string; type?: string; ticketNumber?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await cashRegisterService.getAllCashMovements(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSessions = createAsyncThunk('cashRegister/fetchSessions', async (_, { rejectWithValue }) => {
  try {
    const response = await cashRegisterService.getAllSessions();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const recordServiceIncome = createAsyncThunk(
  'cashRegister/recordServiceIncome',
  async (
    data: { amountUsd: number; amountBs: number; description: string; paymentMethod: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await cashRegisterService.recordServiceIncome(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const cashRegisterSlice = createSlice({
  name: 'cashRegister',
  initialState,
  reducers: {
    clearCashRegisterSession: (state) => {
      state.currentSession = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active Session
      .addCase(fetchActiveSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSession.fulfilled, (state, action: PayloadAction<CashRegisterSession | null>) => {
        state.loading = false;
        state.currentSession = action.payload;
      })
      .addCase(fetchActiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Open Cash Register
      .addCase(openCashRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(openCashRegister.fulfilled, (state, action: PayloadAction<CashRegisterSession>) => {
        state.loading = false;
        state.currentSession = action.payload;
      })
      .addCase(openCashRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Close Cash Register
      .addCase(closeCashRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeCashRegister.fulfilled, (state, _action: PayloadAction<CashRegisterSession>) => {
        state.loading = false;
        state.currentSession = null; // Set current session to null on close
      })
      .addCase(closeCashRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Cash Movements
      .addCase(fetchCashMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashMovements.fulfilled, (state, action: PayloadAction<CashMovement[]>) => {
        state.loading = false;
        state.movements = action.payload;
      })
      .addCase(fetchCashMovements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action: PayloadAction<CashRegisterSession[]>) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Closing Preview
      .addCase(fetchClosingPreview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClosingPreview.fulfilled, (state, action: PayloadAction<CashRegisterSession>) => {
        state.loading = false;
        state.closingPreviewData = action.payload;
      })
      .addCase(fetchClosingPreview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCashRegisterSession } = cashRegisterSlice.actions;
export default cashRegisterSlice.reducer;
