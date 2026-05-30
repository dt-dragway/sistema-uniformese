import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';
import { Product } from '../models/Product';

export interface InventoryMovement {
  id: number;
  productId: number;
  product: Product;
  type: string;
  quantityChange: number;
  reason?: string;
  timestamp: string;
}

interface InventoryState {
  movements: InventoryMovement[];
  internalWithdrawals: InventoryMovement[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  movements: [],
  internalWithdrawals: [],
  loading: false,
  error: null,
};

export const fetchAllInventoryMovements = createAsyncThunk(
  'inventory/fetchAllMovements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<InventoryMovement[]>('/inventory/movements');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchInternalWithdrawals = createAsyncThunk(
  'inventory/fetchInternalWithdrawals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<InventoryMovement[]>('/inventory/movements?type=INTERNAL_CONSUMPTION');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

interface CreateMerchandiseEntryPayload {
  productId: number;
  quantity: number;
  cost: number;
  supplier?: string;
}

export const createMerchandiseEntry = createAsyncThunk(
  'inventory/createMerchandiseEntry',
  async (entryData: CreateMerchandiseEntryPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<InventoryMovement>('/inventory/entries', entryData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createSpecialMovement = createAsyncThunk(
  'inventory/createSpecialMovement',
  async (data: { productId: number; quantity: number; reason: string; type: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<InventoryMovement[]>('/inventory/withdrawals', {
        items: [{ productId: data.productId, quantity: data.quantity }],
        reason: data.reason,
        type: data.type,
      });
      return response.data[0]; // The API returns an array, we take the first one
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllInventoryMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllInventoryMovements.fulfilled, (state, action: PayloadAction<InventoryMovement[]>) => {
        state.loading = false;
        state.movements = action.payload;
      })
      .addCase(fetchAllInventoryMovements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchInternalWithdrawals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInternalWithdrawals.fulfilled, (state, action: PayloadAction<InventoryMovement[]>) => {
        state.loading = false;
        state.internalWithdrawals = action.payload;
      })
      .addCase(createMerchandiseEntry.fulfilled, (state, action: PayloadAction<InventoryMovement>) => {
        state.loading = false;
        state.movements.unshift(action.payload);
      })
      .addCase(createSpecialMovement.fulfilled, (state, action: PayloadAction<InventoryMovement>) => {
        state.loading = false;
        state.internalWithdrawals.unshift(action.payload);
        state.movements.unshift(action.payload);
      });
  },
});

export default inventorySlice.reducer;
