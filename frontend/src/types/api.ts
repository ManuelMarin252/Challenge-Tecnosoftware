
export interface Role {
  id: number;
  name: string;
}


export const RoleEnum = {
  ADMIN: 'admin',
  MERCHANT: 'merchant',
  CUSTOMER: 'customer',
} as const;

export type RoleEnum = (typeof RoleEnum)[keyof typeof RoleEnum];

export interface User {
  id: number;
  email: string;
  roles: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type ProductDetails = Record<string, unknown>;

export interface Product {
  id: number;
  code: string;
  title: string;
  variationType: string;
  description?: string;
  about?: string[];
  details?: ProductDetails;
  isActive: boolean;
  merchantId: number;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InventoryItem {
  id: number;
  stock: number;
  minStock: number;
  productId: number;
  product: Product;
}

export interface Category {
  id: number;
  name: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errorCode: string | null;
  errors: string[];
}

export type InventoryMovementType = 'IN' | 'OUT';

export const InventoryMovementType = {
  IN: 'IN' as const,
  OUT: 'OUT' as const,
};

export interface InventoryMovement {
  id: number;
  productId: number;
  quantity: number;
  type: InventoryMovementType;
  reason: string;
  userId: number;
  createdAt: string;
  user?: User;
  product?: Product;
}

export interface PurchaseItem {
  productId: number;
  quantity: number;
}

export interface CreateUserDto {
  email: string;
  password?: string;
  roleIds: number[];
}
