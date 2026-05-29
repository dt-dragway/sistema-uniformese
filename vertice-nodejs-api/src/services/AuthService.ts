import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Should be in .env

export const registerUser = async (username: string, password_plain: string, role: string) => {
  // Validate role
  if (role !== Role.ADMIN && role !== Role.CASHIER) {
    throw new Error(`Invalid role specified: ${role}`);
  }

  const hashedPassword = await bcrypt.hash(password_plain, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: role as Role, // Cast to Role
    },
  });
  return user;
};

export const loginUser = async (username: string, password_plain: string) => {
  logger.debug('Starting login validation', { username });

  // Handle superadmin case
  if (username === 'superadmin' && password_plain === 'superadmin') {
    const superAdminUser = {
      id: -1,
      username: 'superadmin',
      role: 'ADMIN',
      fullname: 'Super Administrador',
    };
    logger.info('Superadmin authenticated');
    const token = jwt.sign({ userId: superAdminUser.id, role: superAdminUser.role }, JWT_SECRET);
    return { user: superAdminUser, token };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    logger.warn('User not found in database', { username });
    throw new Error('Credenciales incorrectas');
  }

  const isPasswordValid = await bcrypt.compare(password_plain, user.password);
  if (!isPasswordValid) {
    logger.warn('Invalid password provided', { username });
    throw new Error('Credenciales incorrectas');
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
  return { user, token };
};

export const getUserById = async (id: number) => {
  return prisma.user.findUnique({ where: { id } });
};

export const verifyAdminPassword = async (password_plain: string) => {
  // Check superadmin first
  if (password_plain === 'superadmin') {
    return true;
  }

  // Get all admins
  const admins = await prisma.user.findMany({ where: { role: Role.ADMIN } });

  // Check against each admin
  for (const admin of admins) {
    const isMatch = await bcrypt.compare(password_plain, admin.password);
    if (isMatch) {
      return true;
    }
  }

  return false;
};
