import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import productService from '../api/productService';
import { Product } from '../models/Product';
import { RootState } from '.';

interface ProductsState {
  products: Product[];
  mostSoldProducts: Product[]; // Add this line
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  mostSoldProducts: [], // Add this line
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const response = await productService.getAllProducts();
  return response.data;
});

export const fetchMostSoldProducts = createAsyncThunk('products/fetchMostSoldProducts', async () => {
  const response = await productService.getMostSoldProducts();
  return response.data;
});

export const createProduct = createAsyncThunk('products/createProduct', async (product: Omit<Product, 'id'>) => {
  const response = await productService.createProduct(product);
  return response.data;
});

export const updateProduct = createAsyncThunk('products/updateProduct', async (product: Product) => {
  const response = await productService.updateProduct(product.id, product);
  return response.data;
});

export const deleteProduct = createAsyncThunk('products/deleteProduct', async (id: number, { rejectWithValue }) => {
  try {
    await productService.deleteProduct(id);
    return id;
  } catch (error: any) {
    // Extract error message from server response
    const message = error.response?.data?.message || 'Error al eliminar el producto';
    return rejectWithValue(message);
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(fetchMostSoldProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMostSoldProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.mostSoldProducts = action.payload;
      })
      .addCase(fetchMostSoldProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch most sold products';
      })
      .addCase(createProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create product';
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        const index = state.products.findIndex((product) => product.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update product';
      })
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<number>) => {
        state.products = state.products.filter((product) => product.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Error al eliminar el producto';
      });
  },
});

// Selector to get all products
const selectAllProducts = (state: RootState) => state.products.products;

// Selector to get sales filters
const selectSalesFilters = (state: RootState) => state.sales;

// Crear un índice en memoria para búsqueda rápida O(1)
const selectProductSearchIndex = createSelector([selectAllProducts], (products) => {
  const nameIndex = new Map<string, Product[]>();
  const barcodeIndex = new Map<string, Product>();

  products.forEach((product) => {
    // Indexar por palabras del nombre (para búsqueda parcial rápida)
    const words = product.name.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      if (word.length >= 2) {
        const existing = nameIndex.get(word) || [];
        existing.push(product);
        nameIndex.set(word, existing);
      }
    });

    // Indexar por código de barras (búsqueda exacta)
    if (product.barCode) {
      barcodeIndex.set(product.barCode, product);
    }
  });

  return { nameIndex, barcodeIndex, products };
});

// Memoized selector for filtered products - OPTIMIZADO para respuesta instantánea
export const selectFilteredProducts = createSelector(
  [selectProductSearchIndex, selectSalesFilters],
  (searchIndex, salesFilters) => {
    const { searchTerm, quickFilter } = salesFilters;
    const { products, barcodeIndex, nameIndex } = searchIndex;

    // Si no hay filtro, retornar todos
    if (!searchTerm.trim() && !quickFilter) {
      return products;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    // Filtro rápido: búsqueda por código de barras exacto
    if (normalizedSearch && barcodeIndex.has(searchTerm.trim())) {
      const product = barcodeIndex.get(searchTerm.trim())!;
      if (!quickFilter || matchesQuickFilter(product, quickFilter)) {
        return [product];
      }
      return [];
    }

    // Filtrado con índice optimizado
    let candidateProducts: Product[];

    if (normalizedSearch.length >= 2) {
      // Buscar en el índice de palabras
      const words = normalizedSearch.split(/\s+/).filter((w) => w.length >= 2);
      if (words.length > 0) {
        // Intersección de resultados para múltiples palabras
        const matchSets = words.map((word) => {
          const matches = new Set<Product>();
          nameIndex.forEach((prods, key) => {
            if (key.includes(word)) {
              prods.forEach((p) => matches.add(p));
            }
          });
          return matches;
        });

        // También incluir matches por barcode parcial
        products.forEach((p) => {
          if (p.barCode?.includes(searchTerm.trim())) {
            matchSets[0]?.add(p);
          }
        });

        if (matchSets.length === 1) {
          candidateProducts = Array.from(matchSets[0]);
        } else {
          // Intersección de todos los sets
          candidateProducts = Array.from(matchSets[0]).filter((p) => matchSets.slice(1).every((set) => set.has(p)));
        }
      } else {
        candidateProducts = products;
      }
    } else if (normalizedSearch.length > 0) {
      // Búsqueda corta: filtro lineal pero rápido
      candidateProducts = products.filter(
        (p) => p.name.toLowerCase().includes(normalizedSearch) || p.barCode?.includes(searchTerm.trim())
      );
    } else {
      candidateProducts = products;
    }

    // Aplicar quick filter si existe
    if (quickFilter) {
      return candidateProducts.filter((p) => matchesQuickFilter(p, quickFilter));
    }

    return candidateProducts;
  }
);

// Helper para filtros rápidos
function matchesQuickFilter(product: Product, quickFilter: string): boolean {
  if (quickFilter === 'promotions') {
    return !!(product.offerPrice && product.offerPrice > 0);
  }
  return true;
}

export default productsSlice.reducer;
