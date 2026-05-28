import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCreditPayments } from '../api/creditService';
import { CreditPayment } from '../models/CreditPayment'; // I need to create this model

interface CreditsState {
  creditMovements: CreditPayment[];
  loading: boolean;
  error: string | null;
}

const initialState: CreditsState = {
  creditMovements: [],
  loading: false,
  error: null,
};

export const fetchCreditMovements = createAsyncThunk(
  'credits/fetchCreditMovements',
  async (customerId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await getCreditPayments(customerId);
      return response;
    } catch (error: any) {
      return rejectWithValue((error as any).response?.data?.message || (error as Error).message);
    }
  }
);

const creditsSlice = createSlice({
  name: 'credits',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCreditMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditMovements.fulfilled, (state, action) => {
        state.loading = false;
        state.creditMovements = action.payload;
      })
      .addCase(fetchCreditMovements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default creditsSlice.reducer;
