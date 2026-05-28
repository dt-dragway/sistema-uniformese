import { PrismaClient, Prisma, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

class PaymentMethodService {
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return prisma.paymentMethod.findMany();
  }

  async getPaymentMethodById(id: number): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findUnique({ where: { id } });
  }

  async createPaymentMethod(newMethod: Prisma.PaymentMethodCreateInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.create({ data: newMethod });
  }

  async updatePaymentMethod(id: number, updatedFields: Prisma.PaymentMethodUpdateInput): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.update({ where: { id }, data: updatedFields });
  }

  async deletePaymentMethod(id: number): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.delete({ where: { id } });
  }
}

export const paymentMethodService = new PaymentMethodService();
