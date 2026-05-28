import { PrismaClient, Prisma, Customer } from '@prisma/client';

const prisma = new PrismaClient();

class CustomerService {
  async getAllCustomers(): Promise<Customer[]> {
    return prisma.customer.findMany();
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { id } });
  }

  async createCustomer(newCustomerData: Prisma.CustomerCreateInput): Promise<Customer> {
    // Prisma handles default values like currentCredit, so we just pass the data.
    return prisma.customer.create({
      data: newCustomerData,
    });
  }

  async updateCustomer(id: number, updatedFields: Prisma.CustomerUpdateInput): Promise<Customer | null> {
    return prisma.customer.update({
      where: { id },
      data: updatedFields,
    });
  }

  async deleteCustomer(id: number): Promise<Customer | null> {
    return prisma.customer.delete({ where: { id } });
  }

  async updateCustomerCredit(id: number, amount: number): Promise<Customer | null> {
    return prisma.customer.update({
      where: { id },
      data: {
        currentCredit: {
          increment: amount,
        },
      },
    });
  }
}

export const customerService = new CustomerService();
