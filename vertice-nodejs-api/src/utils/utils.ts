import { Request } from 'express';

// Extender la interfaz de Request para incluir la propiedad 'user' con id y role
export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const getUserIdFromRequest = (req: AuthRequest): number | null => {
  const user = req.user;
  if (user && user.id) {
    return user.id;
  }
  return null;
};

export const getUserRoleFromRequest = (req: AuthRequest): string | null => {
  const user = req.user;
  if (user && user.role) {
    return user.role;
  }
  return null;
};

export const isAdmin = (req: AuthRequest): boolean => {
  const role = getUserRoleFromRequest(req);
  return role === 'ADMIN';
};
