
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import userService from '../api/userService';
import { User } from '../models/User';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await userService.getUsers();
  return response.data;
});

export const createUser = createAsyncThunk('users/createUser', async (user: Omit<User, 'id'>) => {
  const response = await userService.createUser(user);
  return response.data;
});

export const updateUser = createAsyncThunk('users/updateUser', async (user: Partial<User>) => {
  if (!user.id) throw new Error('User ID is required for update');
  const response = await userService.updateUser(user.id, user);
  return response.data;
});

export const deleteUser = createAsyncThunk('users/deleteUser', async (id: number) => {
  await userService.deleteUser(id);
  return id;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.users.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<number>) => {
        state.users = state.users.filter((user) => user.id !== action.payload);
      });
  },
});

export default usersSlice.reducer;
