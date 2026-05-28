import { configureStore } from '@reduxjs/toolkit';
import suppliersReducer from './suppliersSlice';
import customersReducer from './customersSlice';
import productsReducer from './productsSlice';
import cashRegisterReducer from './cashRegisterSlice';
import authReducer from './authSlice'; // Import authReducer
import cartReducer from './cartSlice'; // Import cartReducer
import appConfigReducer from './appConfigSlice'; // Import appConfigReducer
import salesReducer from './salesSlice'; // Import salesReducer
import creditsReducer from './creditsSlice';
import uiReducer from './uiSlice';
import usersReducer from './usersSlice';
import inventoryReducer from './inventorySlice'; // Import inventoryReducer
import printerReducer from './printerSlice'; // Import printerReducer

export const store = configureStore({
  reducer: {
    suppliers: suppliersReducer,
    customers: customersReducer,
    products: productsReducer,
    cashRegister: cashRegisterReducer,
    auth: authReducer, // Add authReducer
    cart: cartReducer, // Add cartReducer
    appConfig: appConfigReducer, // Add appConfigReducer
    sales: salesReducer, // Add salesReducer
    credits: creditsReducer,
    ui: uiReducer,
    users: usersReducer,
    inventory: inventoryReducer, // Add inventoryReducer
    printer: printerReducer, // Add printerReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
