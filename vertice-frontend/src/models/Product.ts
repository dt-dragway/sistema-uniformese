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
  
  // Propiedades para tienda de uniformes
  tipo?: string;
  caracteristica?: string;
  detalle?: string;
  talla?: string;
  tela?: string;
  color?: string;

  isActive?: boolean; // Soft delete flag
  createdAt: string;
  updatedAt: string;
}
