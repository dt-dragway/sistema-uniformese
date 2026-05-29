import { Request, Response } from 'express';
import { registerUser, loginUser, verifyAdminPassword } from '../services/AuthService';
import { getUserById } from '../services/UserService';
import { AuthRequest } from '../utils/utils';

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

export const login = async (req: Request, res: Response) => {
  console.log('[AuthController] Attempting to log in...');
  try {
    const { username, password } = req.body;
    console.log(`[AuthController] Login request for username: ${username}`);
    if (!username || !password) {
      console.error('[AuthController] Username or password not provided.');
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const { user, token } = await loginUser(username, password);
    console.log(`[AuthController] Login successful for user: ${user.username}`);
    res
      .status(200)
      .json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role, fullname: user.fullname }, token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[AuthController] Error during login: ${error.message}`);
      res.status(400).json({ message: error.message });
    } else {
      console.error(`[AuthController] An unknown error occurred:`, error);
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
