import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Should be in .env
console.log('AuthService JWT_SECRET:', JWT_SECRET);

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
  console.log(`[AuthService] Starting login for username: '${username}'`);

  // Handle superadmin case
  if (username === 'superadmin' && password_plain === 'superadmin') {
    console.log('[AuthService] Detected superadmin login attempt.');
    const superAdminUser = {
      id: -1,
      username: 'superadmin',
      role: 'ADMIN',
      fullname: 'Super Administrador',
    };
    console.log('[AuthService] Superadmin login successful.');
    const token = jwt.sign({ userId: superAdminUser.id, role: superAdminUser.role }, JWT_SECRET);
    console.log('[AuthService] Superadmin token generated.');
    return { user: superAdminUser, token };
  }

  console.log(`[AuthService] Looking up user '${username}' in the database.`);
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.error(`[AuthService] User '${username}' not found in database.`);
    throw new Error('Credenciales incorrectas');
  }
  console.log(`[AuthService] User '${username}' found in database.`);

  console.log(`[AuthService] Comparing provided password with stored hash for user '${username}'.`);
  const isPasswordValid = await bcrypt.compare(password_plain, user.password);
  if (!isPasswordValid) {
    console.error(`[AuthService] Password validation failed for user '${username}'.`);
    throw new Error('Credenciales incorrectas');
  }
  console.log(`[AuthService] Password is valid for user '${username}'.`);

  console.log(`[AuthService] Generating JWT for user '${username}'.`);
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
  console.log(`[AuthService] JWT generated successfully for user '${username}'.`);
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
