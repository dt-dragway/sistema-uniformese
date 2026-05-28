import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSavedPrinter } from '../api/settingService';

interface PrinterState {
  printerName: string | null;
  loading: boolean;
}

const initialState: PrinterState = {
  printerName: null,
  loading: false,
};

export const fetchSavedPrinterAsync = createAsyncThunk('printer/fetchSavedPrinter', async () => {
  const response = await getSavedPrinter();
  return response.printer;
});

const printerSlice = createSlice({
  name: 'printer',
  initialState,
  reducers: {
    setPrinterName: (state, action) => {
      state.printerName = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedPrinterAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSavedPrinterAsync.fulfilled, (state, action) => {
        state.printerName = action.payload;
        state.loading = false;
      });
  },
});

export const { setPrinterName } = printerSlice.actions;
export default printerSlice.reducer;
