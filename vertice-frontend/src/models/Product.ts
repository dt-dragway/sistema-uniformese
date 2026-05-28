export type UnitType = 'UNIT' | 'KG' | 'LITER';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  desiredStock: number;
  offerPrice: number;
  barCode?: string;
  categoryId?: number;
  unitType: UnitType; // Type of unit: UNIT, KG, or LITER
  isActive?: boolean; // Soft delete flag
  createdAt: string;
  updatedAt: string;
}
