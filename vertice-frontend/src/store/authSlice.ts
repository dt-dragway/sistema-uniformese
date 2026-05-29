import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { getApiUrl } from '../api/axiosInstance';

interface AuthState {
  user: { id: number; username: string; role: string; fullname?: string | null } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: Record<string, string>, { rejectWithValue }) => {
    try {
      const apiUrl = getApiUrl();
      const loginUrl = `${apiUrl}/auth/login`;
      console.log('[Auth] Login attempt:', {
        apiUrl,
        loginUrl,
        serverUrlInStorage: localStorage.getItem('serverUrl')
      });
      const response = await axios.post(loginUrl, { username, password });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[Auth] Login error:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUserFromToken = createAsyncThunk('auth/fetchUserFromToken', async (_, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as { auth: AuthState }).auth.token;
    if (!token) {
      return rejectWithValue('No token found');
    }
    const response = await axios.get(`${getApiUrl()}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }>;
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<{ user: { id: number; username: string; role: string; fullname?: string | null }; token: string }>) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      })
      .addCase(fetchUserFromToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserFromToken.fulfilled,
        (state, action: PayloadAction<{ user: { id: number; username: string; role: string; fullname?: string | null } }>) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
        }
      )
      .addCase(fetchUserFromToken.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null; // Also clear the token if fetching user fails
        localStorage.removeItem('token');
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
