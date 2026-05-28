import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import appConfigService from '../api/appConfigService';

interface AppConfigState {
  exchangeRate: number;
  loading: boolean;
  error: string | null;
}

const initialState: AppConfigState = {
  exchangeRate: 0,
  loading: false,
  error: null,
};

export const fetchExchangeRateAsync = createAsyncThunk(
  'appConfig/fetchExchangeRate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await appConfigService.getCurrentExchangeRate();
      return response.data.rate; // Assuming the API returns { rate: number }
    } catch (error: any) {
      return rejectWithValue((error as any).response?.data?.message || (error as Error).message);
    }
  }
);

export const updateExchangeRateAsync = createAsyncThunk(
  'appConfig/updateExchangeRate',
  async (newRate: number, { rejectWithValue }) => {
    try {
      const response = await appConfigService.updateExchangeRate(newRate);
      return response.data.rate;
    } catch (error: any) {
      return rejectWithValue((error as any).response?.data?.message || (error as Error).message);
    }
  }
);

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    setExchangeRate: (state, action: PayloadAction<number>) => {
      state.exchangeRate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRateAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExchangeRateAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.exchangeRate = action.payload;
      })
      .addCase(fetchExchangeRateAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateExchangeRateAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExchangeRateAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.exchangeRate = action.payload;
      })
      .addCase(updateExchangeRateAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setExchangeRate } = appConfigSlice.actions;
export default appConfigSlice.reducer;
