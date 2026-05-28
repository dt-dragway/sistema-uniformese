import { PrismaClient, Supplier, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class SupplierService {
  async getAllSuppliers(): Promise<Supplier[]> {
    return prisma.supplier.findMany();
  }

  async getSupplierById(id: number): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { id: id },
    });
  }

  async createSupplier(newSupplier: Prisma.SupplierCreateInput): Promise<Supplier> {
    return prisma.supplier.create({ data: newSupplier });
  }

  async updateSupplier(id: number, updatedFields: Partial<Supplier>): Promise<Supplier | null> {
    try {
      return await prisma.supplier.update({
        where: { id: id },
        data: { ...updatedFields, updatedAt: new Date() },
      });
    } catch (error) {
      return null;
    }
  }

  async deleteSupplier(id: number): Promise<boolean> {
    try {
      await prisma.supplier.delete({
        where: { id: id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const supplierService = new SupplierService();
