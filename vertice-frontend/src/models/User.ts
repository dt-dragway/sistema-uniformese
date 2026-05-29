
export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'CASHIER';
  fullname?: string | null;
}
