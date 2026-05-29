import { PrismaClient, Role, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getAllUsers = async () => {
  return prisma.user.findMany({
    where: {
      username: {
        not: 'superadmin',
      },
    },
    select: { id: true, username: true, role: true, fullname: true },
  });
};

export const getUserById = async (id: number) => {
  return prisma.user.findUnique({ where: { id }, select: { id: true, username: true, role: true, fullname: true } });
};

export const createUser = async (username: string, password_plain: string, role: string, fullname?: string) => {
  if (role !== Role.ADMIN && role !== Role.CASHIER) {
    throw new Error(`Invalid role specified: ${role}`);
  }
  const hashedPassword = await bcrypt.hash(password_plain, 10);
  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: role as Role,
      fullname,
    },
    select: { id: true, username: true, role: true, fullname: true },
  });
};

export const updateUser = async (id: number, data: { username?: string; password?: string; role?: string; fullname?: string }) => {
  const updateData: Prisma.UserUpdateInput = {};

  if (data.username) {
    updateData.username = data.username;
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (data.role) {
    if (data.role !== Role.ADMIN && data.role !== Role.CASHIER) {
      throw new Error(`Invalid role specified: ${data.role}`);
    }
    updateData.role = data.role;
  }

  if (data.fullname !== undefined) {
    updateData.fullname = data.fullname;
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, role: true, fullname: true },
  });
};

export const deleteUser = async (id: number) => {
  return prisma.user.delete({ where: { id }, select: { id: true, username: true, role: true, fullname: true } });
};
