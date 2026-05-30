import axiosInstance from './axiosInstance';
import { User } from '../models/User'; // Assuming a User model exists

const getUsers = () => {
  return axiosInstance.get<User[]>('/users');
};

const createUser = (user: Omit<User, 'id'>) => {
  return axiosInstance.post<User>('/users', user);
};

const updateUser = (id: number, user: Partial<User>) => {
  return axiosInstance.put<User>(`/users/${id}`, user);
};

const deleteUser = (id: number) => {
  return axiosInstance.delete(`/users/${id}`);
};

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
