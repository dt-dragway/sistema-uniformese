import { Request, Response } from 'express';
import { registerUser, loginUser, verifyAdminPassword } from '../services/AuthService';
import { getUserById } from '../services/UserService';
import { AuthRequest } from '../utils/utils';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;
    const user = await registerUser(username, password, role || 'user');
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, role: user.role, fullname: user.fullname },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    }
  }
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  logger.debug('Login request received');
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      logger.warn('Username or password missing in login request');
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const { user, token } = await loginUser(username, password);
    logger.info('Login successful', { username: user.username });
    
    // Registrar la conexión en el historial (solo para usuarios normales, excluyendo superadmin)
    if (user.id !== -1) {
      try {
        await prisma.userConnection.create({
          data: {
            userId: user.id,
            ipAddress: req.ip || req.socket.remoteAddress || 'Desconocida',
            userAgent: req.headers['user-agent'] || 'Desconocido',
          }
        });
      } catch (err) {
        logger.error('Error recording user connection', { error: err });
      }
    }

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role, fullname: user.fullname },
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.warn('Login failed', { error: error.message });
      res.status(400).json({ message: error.message });
    } else {
      logger.error('Unknown error during login', { error });
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    }
  }
};

export const verifyAdmin = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const isValid = await verifyAdminPassword(password);
    if (isValid) {
      res.status(200).json({ success: true, message: 'Admin verified' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid admin password' });
    }
  } catch (error: unknown) {
    res.status(500).json({ message: 'Error verifying admin password' });
  }
};
