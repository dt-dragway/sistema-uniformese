import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Customer } from '../models/Customer';
import customerService from '../api/customerService';

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  loading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async () => {
  const response = await customerService.getAllCustomers();
  return response.data;
});

export const createCustomer = createAsyncThunk('customers/createCustomer', async (customer: Omit<Customer, 'id'>) => {
  const response = await customerService.createCustomer(customer);
  return response.data;
});

export const updateCustomer = createAsyncThunk('customers/updateCustomer', async (customer: Customer) => {
  const response = await customerService.updateCustomer(customer.id, customer);
  return response.data;
});

export const deleteCustomer = createAsyncThunk('customers/deleteCustomer', async (id: number, { rejectWithValue }) => {
  try {
    await customerService.deleteCustomer(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Error al eliminar el cliente');
  }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.push(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create customer';
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex((customer) => customer.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter((customer) => customer.id !== action.payload);
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default customersSlice.reducer;
