
export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  CHECKED_OUT = 'CHECKED_OUT',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Item {
  id: string;
  name: string;
  category: string;
  status: ItemStatus;
}

export interface Trainer {
  id: string;
  name: string;
  password?: string; // Optional initially, but required for login
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  trainerId: string;
  trainerName: string;
  checkoutTime: string; // ISO String
  returnTime?: string; // ISO String
  isActive: boolean;
  returnRequested?: boolean; // New flag: True if trainer requested return but not yet approved
}

export type PageView = 'dashboard' | 'checkout' | 'return' | 'history' | 'inventory' | 'trainer-view' | 'trainer-portal';
