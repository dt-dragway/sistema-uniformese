import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../models/Product';

interface UIState {
  isProductModalOpen: boolean;
  newProductBarcode: string | null;
  productToEdit: Product | null;
}

const initialState: UIState = {
  isProductModalOpen: false,
  newProductBarcode: null,
  productToEdit: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openProductModal(state, action: PayloadAction<{ barcode?: string; product?: Product } | undefined>) {
      state.isProductModalOpen = true;
      state.newProductBarcode = action.payload?.barcode || null;
      state.productToEdit = action.payload?.product || null;
    },
    closeProductModal(state) {
      state.isProductModalOpen = false;
      state.newProductBarcode = null;
      state.productToEdit = null;
    },
  },
});

export const { openProductModal, closeProductModal } = uiSlice.actions;
export default uiSlice.reducer;
