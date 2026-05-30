import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getUserConnections = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const connections = await prisma.userConnection.findMany({
      skip,
      take: limit,
      orderBy: {
        loginTime: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            role: true,
          },
        },
      },
    });

    const total = await prisma.userConnection.count();

    res.status(200).json({
      connections,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    logger.error('Error fetching user connections', { error });
    res.status(500).json({ message: 'Error al obtener el historial de conexiones' });
  }
};
