import { PrismaClient, Prisma, Product } from '@prisma/client';
import { exchangeRateService } from './ExchangeRateService';

const prisma = new PrismaClient();

class ProductService {
  async getAllProducts(convertToBs = false): Promise<Product[]> {
    // Only get active products (soft delete filter)
    const products = await prisma.product.findMany({
      where: { isActive: true },
    });
    if (convertToBs) {
      const rateData = await exchangeRateService.getCurrentExchangeRate();
      const rate = rateData?.rate || 1;
      return products.map((product) => ({
        ...product,
        price: product.price * rate,
      }));
    }
    return products;
  }

  async getProductById(id: number, convertToBs = false): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id: id },
    });
    if (product && convertToBs) {
      const rateData = await exchangeRateService.getCurrentExchangeRate();
      const rate = rateData?.rate || 1;
      return {
        ...product,
        price: product.price * rate,
      };
    }
    return product;
  }

  async createProduct(newProduct: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data: newProduct });
  }

  async updateProduct(id: number, updatedFields: Partial<Product>): Promise<Product | null> {
    try {
      return await prisma.product.update({
        where: { id: id },
        data: { ...updatedFields, updatedAt: new Date() },
      });
    } catch (error) {
      // Handle cases where product with id is not found
      return null;
    }
  }

  async deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Soft delete: set isActive to false instead of deleting
      await prisma.product.update({
        where: { id: id },
        data: { isActive: false, updatedAt: new Date() },
      });
      return { success: true };
    } catch (error: any) {
      // Handle product not found
      if (error.code === 'P2025') {
        return { success: false, error: 'El producto no fue encontrado.' };
      }
      return { success: false, error: 'Error al eliminar el producto.' };
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    // Only get active products with low stock
    return await prisma.$queryRaw<Product[]>`SELECT * FROM "Product" WHERE "stock" <= "minStock" AND "isActive" = true`;
  }

  async getProductByBarcode(barCode: string, convertToBs = false): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { barCode: barCode },
    });
    if (product && convertToBs) {
      const rateData = await exchangeRateService.getCurrentExchangeRate();
      const rate = rateData?.rate || 1;
      return {
        ...product,
        price: product.price * rate,
      };
    }
    return product;
  }

  async getMostSoldProducts(): Promise<Product[]> {
    const mostSoldItems = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const productIds = mostSoldItems.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    // Return products in the order of most sold
    return productIds.map(productId => products.find(p => p.id === productId)).filter((p): p is Product => !!p);
  }
}

export const productService = new ProductService();
