export interface Customer {
  id: number;
  cedula: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  currentCredit: number;
}
