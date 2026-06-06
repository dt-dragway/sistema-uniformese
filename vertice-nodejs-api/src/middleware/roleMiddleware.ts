import { Response, NextFunction } from 'express';
import { AuthRequest } from '../utils/utils';

/**
 * Middleware para restringir acceso según el rol del usuario.
 * @param allowedRoles Array de roles permitidos (ej. ['ADMIN'])
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Acceso denegado. No tienes los privilegios necesarios para esta acción.' 
      });
    }

    next();
  };
};
