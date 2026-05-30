import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../models/Product';

// Data específicos de una recarga en el carrito
export interface RechargeData {
  serviceId: number;
  serviceName: string;
  phoneNumber: string;
  amountBs: number;
  commissionPercent: number;
  commissionBs: number;
  totalChargeBs: number;
}

// Data específicos de un avance de efectivo en el carrito
export interface CashAdvanceData {
  amountToGive: number; // Monto a entregar
  commissionPercent: number;
  commissionBs: number;
  totalChargeBs: number;
  paymentMethod: string; // Método de pago (Punto de Venta, Pago Móvil)
}

export interface CartItem extends Product {
  quantity: number;
  isRecharge?: boolean; // Flag para identificar items de recarga
  rechargeData?: RechargeData; // Datos de la recarga (solo si isRecharge es true)
  isCashAdvance?: boolean; // Flag para identificar avances de efectivo
  cashAdvanceData?: CashAdvanceData; // Datos del avance (solo si isCashAdvance es true)
}

export interface Venta {
  id: string;
  name: string;
  items: CartItem[];
  customerId: number | null; // Customer associated with this sale
}

interface MultiCartState {
  ventas: Venta[];
  activeVentaId: string | null;
  nextRechargeId: number; // IDs negativos para recargas
}

// Function to generate a unique ID for tickets
const generateId = () => new Date().getTime().toString();

const createNewVenta = (id: string, name: string): Venta => ({
  id,
  name,
  items: [],
  customerId: null,
});

const firstVentaId = generateId();
const initialState: MultiCartState = {
  ventas: [createNewVenta(firstVentaId, 'Venta 1')],
  activeVentaId: firstVentaId,
  nextRechargeId: -1, // Comenzar con IDs negativos
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addVenta: (state) => {
      const newId = generateId();
      const newVentaName = `Venta ${state.ventas.length + 1}`;
      state.ventas.push(createNewVenta(newId, newVentaName));
      state.activeVentaId = newId;
    },
    switchVenta: (state, action: PayloadAction<string>) => {
      state.activeVentaId = action.payload;
    },
    clearVenta: (state, action: PayloadAction<string>) => {
      const ventaToClear = state.ventas.find((venta) => venta.id === action.payload);
      if (ventaToClear) {
        ventaToClear.items = [];
        ventaToClear.customerId = null;
      }
    },
    setVentaCustomer: (state, action: PayloadAction<{ ventaId: string; customerId: number | null }>) => {
      const venta = state.ventas.find((v) => v.id === action.payload.ventaId);
      if (venta) {
        venta.customerId = action.payload.customerId;
      }
    },
    removeVenta: (state, action: PayloadAction<string>) => {
      const ventaIdToRemove = action.payload;
      // Prevent removing the last venta
      if (state.ventas.length > 1) {
        state.ventas = state.ventas.filter((venta) => venta.id !== ventaIdToRemove);
        if (state.activeVentaId === ventaIdToRemove) {
          state.activeVentaId = state.ventas[0]?.id || null;
        }
      }
    },
    addProductToCart: (state, action: PayloadAction<{ product: Product; quantity: number }>) => {
      const activeVenta = state.ventas.find((venta) => venta.id === state.activeVentaId);
      if (!activeVenta) return;

      const { product, quantity } = action.payload;
      const existingItem = activeVenta.items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        activeVenta.items.push({ ...product, quantity });
      }
    },
    addRechargeToCart: (
      state,
      action: PayloadAction<{
        serviceName: string;
        serviceId: number;
        phoneNumber: string;
        amountBs: number;
        commissionPercent: number;
        commissionBs: number;
        totalChargeBs: number;
        priceUsd: number; // Total en USD (incluyendo comisión)
      }>
    ) => {
      const activeVenta = state.ventas.find((venta) => venta.id === state.activeVentaId);
      if (!activeVenta) return;

      const {
        serviceName,
        serviceId,
        phoneNumber,
        amountBs,
        commissionPercent,
        commissionBs,
        totalChargeBs,
        priceUsd,
      } = action.payload;

      // Crear item de recarga con ID negativo
      const rechargeItem: CartItem = {
        id: state.nextRechargeId,
        name: `Recarga ${serviceName} - ${phoneNumber}`,
        description: `Servicio: ${serviceName}`,
        price: priceUsd,
        cost: 0,
        stock: 999, // No aplica para recargas
        minStock: 0,
        desiredStock: 0,
        offerPrice: 0,
        unitType: 'UNIT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quantity: 1,
        isRecharge: true,
        rechargeData: {
          serviceId,
          serviceName,
          phoneNumber,
          amountBs,
          commissionPercent,
          commissionBs,
          totalChargeBs,
        },
      };

      activeVenta.items.push(rechargeItem);
      state.nextRechargeId -= 1; // Decrementar para próxima recarga
    },
    updateCartItemQuantity: (state, action: PayloadAction<{ productId: number; newQuantity: number }>) => {
      const activeVenta = state.ventas.find((venta) => venta.id === state.activeVentaId);
      if (!activeVenta) return;

      const { productId, newQuantity } = action.payload;
      const itemToUpdate = activeVenta.items.find((item) => item.id === productId);

      if (itemToUpdate) {
        // No permitir cambiar cantidad de recargas o avances
        if (itemToUpdate.isRecharge || itemToUpdate.isCashAdvance) return;

        if (newQuantity <= 0) {
          activeVenta.items = activeVenta.items.filter((item) => item.id !== productId);
        } else {
          itemToUpdate.quantity = newQuantity;
        }
      }
    },
    updateCartItemPrice: (state, action: PayloadAction<{ productId: number; newPrice: number }>) => {
      const activeVenta = state.ventas.find((venta) => venta.id === state.activeVentaId);
      if (!activeVenta) return;

      const { productId, newPrice } = action.payload;
      const itemToUpdate = activeVenta.items.find((item) => item.id === productId);

      if (itemToUpdate) {
        // No permitir cambiar precio de recargas o avances
        if (itemToUpdate.isRecharge || itemToUpdate.isCashAdvance) return;
        itemToUpdate.price = newPrice;
      }
    },
    addCashAdvanceToCart: (
      state,
      action: PayloadAction<{
        amountToGive: number;
        commissionPercent: number;
        commissionBs: number;
        totalChargeBs: number;
        paymentMethod: string;
        priceUsd: number; // Total en USD
      }>
    ) => {
      const activeVenta = state.ventas.find((venta) => venta.id === state.activeVentaId);
      if (!activeVenta) return;

      const { amountToGive, commissionPercent, commissionBs, totalChargeBs, paymentMethod, priceUsd } = action.payload;

      // Crear item de avance de efectivo con ID negativo
      const cashAdvanceItem: CartItem = {
        id: state.nextRechargeId,
        name: `Avance Efectivo - Bs ${amountToGive.toFixed(2)}`,
        description: `Método: ${paymentMethod}`,
        price: priceUsd,
        cost: 0,
        stock: 999,
        minStock: 0,
        desiredStock: 0,
        offerPrice: 0,
        unitType: 'UNIT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quantity: 1,
        isCashAdvance: true,
        cashAdvanceData: {
          amountToGive,
          commissionPercent,
          commissionBs,
          totalChargeBs,
          paymentMethod,
        },
      };

      activeVenta.items.push(cashAdvanceItem);
      state.nextRechargeId -= 1;
    },
    removeProductFromCart: (state, action: PayloadAction<{ productId: number }>) => {
      const activeVenta = state.ventas.find((venta) => venta.id === state.activeVentaId);
      if (activeVenta) {
        activeVenta.items = activeVenta.items.filter((item) => item.id !== action.payload.productId);
      }
    },
    clearCart: (state) => {
      const activeVenta = state.ventas.find((venta) => venta.id === state.activeVentaId);
      if (activeVenta) {
        activeVenta.items = [];
      }
    },
  },
});

export const {
  addVenta,
  switchVenta,
  clearVenta,
  setVentaCustomer,
  removeVenta,
  addProductToCart,
  addRechargeToCart,
  addCashAdvanceToCart,
  updateCartItemQuantity,
  updateCartItemPrice,
  removeProductFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
