/**
 * API response types - Matching backend API contracts
 */

// User types
export interface BillerUser {
  id: string;
  username: string;
  role: "biller";
  is_active: boolean;
  created_at: string;
}

export interface CreateBillerRequest {
  username: string;
  password: string;
  role: "biller";
  is_active?: boolean;
}

export interface Assignment {
  id: string;
  admin_id: string;
  biller_id: string;
  area_ids: string[];
  created_at: string;
}

export interface CreateAssignmentRequest {
  biller_id: string;
  area_ids: string[];
}

// Area types - Backend: name, sort_order, created_at (NO description, is_active)
export interface Area {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  table_count?: number; // Computed client-side or from backend if available
}

export interface CreateAreaRequest {
  name: string;
  sort_order?: number;
}

export interface UpdateAreaRequest {
  name?: string;
  sort_order?: number;
}

// Table types - Backend: name, capacity, position {x, y}, status, current_order_id (NO label, shape, rotation, is_active)
export interface Table {
  id: string;
  area_id: string;
  name: string;
  capacity?: number;
  position?: {
    x: number;
    y: number;
  };
  status: "available" | "occupied" | "reserved" | "out_of_order";
  current_order_id?: string | null;
  updated_at: string;
}

export interface CreateTableRequest {
  name: string;
  capacity?: number;
  position?: {
    x: number;
    y: number;
  };
  status?: "available" | "occupied" | "reserved" | "out_of_order";
}

export interface UpdateTableRequest {
  name?: string;
  capacity?: number;
  position?: {
    x?: number;
    y?: number;
  };
  status?: "available" | "occupied" | "reserved" | "out_of_order";
  current_order_id?: string | null;
}

// Menu types - Backend: name, sort_order for categories; category_id, name, price, is_active for items
export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  item_count?: number; // Computed client-side or from backend if available
}

export interface CreateCategoryRequest {
  name: string;
  sort_order?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  sort_order?: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateMenuItemRequest {
  category_id: string;
  name: string;
  price: number;
  is_active?: boolean;
}

export interface UpdateMenuItemRequest {
  name?: string;
  price?: number;
  is_active?: boolean;
}
