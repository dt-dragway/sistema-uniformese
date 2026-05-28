import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';
import { Product } from '../models/Product';

// Define the InventoryMovement interface based on your backend model
interface InventoryMovement {
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
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  movements: [],
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

export const fetchInventoryMovementsByProductId = createAsyncThunk(
  'inventory/fetchMovementsByProductId',
  async (productId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<InventoryMovement[]>(`/inventory/movements/product/${productId}`);
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
      .addCase(fetchInventoryMovementsByProductId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryMovementsByProductId.fulfilled, (state, action: PayloadAction<InventoryMovement[]>) => {
        state.loading = false;
        state.movements = action.payload;
      })
      .addCase(fetchInventoryMovementsByProductId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createMerchandiseEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMerchandiseEntry.fulfilled, (state, action: PayloadAction<InventoryMovement>) => {
        state.loading = false;
        state.movements.unshift(action.payload); // Add new entry to the beginning
      })
      .addCase(createMerchandiseEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default inventorySlice.reducer;
