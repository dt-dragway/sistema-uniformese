import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Supplier } from '../models/Supplier';
import supplierService from '../api/supplierService';

interface SuppliersState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
}

const initialState: SuppliersState = {
  suppliers: [],
  loading: false,
  error: null,
};

export const fetchSuppliers = createAsyncThunk('suppliers/fetchSuppliers', async () => {
  const response = await supplierService.getAllSuppliers();
  return response.data;
});

export const createSupplier = createAsyncThunk('suppliers/createSupplier', async (supplier: Omit<Supplier, 'id'>) => {
  const response = await supplierService.createSupplier(supplier);
  return response.data;
});

export const updateSupplier = createAsyncThunk('suppliers/updateSupplier', async (supplier: Supplier) => {
  const response = await supplierService.updateSupplier(supplier.id, supplier);
  return response.data;
});

export const deleteSupplier = createAsyncThunk('suppliers/deleteSupplier', async (id: number) => {
  await supplierService.deleteSupplier(id);
  return id;
});

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch suppliers';
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.suppliers.push(action.payload);
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.suppliers.findIndex((supplier) => supplier.id === action.payload.id);
        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((supplier) => supplier.id !== action.payload);
      });
  },
});

export default suppliersSlice.reducer;
