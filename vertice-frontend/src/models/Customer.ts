export interface Customer {
  id: number;
  cedula: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  category?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  otherContact?: string | null;
  creditLimit: number;
  currentCredit: number;
}
