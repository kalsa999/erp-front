// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'CLIENT';

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY'
  | 'SERVED' | 'BILLED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'COMPLETED' | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ReservationStatus =
  | 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type SupplierOrderStatus =
  | 'DRAFT' | 'SUBMITTED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type LoyaltyTransactionType =
  | 'EARN_ORDER' | 'BONUS_MILESTONE' | 'REDEEM_REWARD' | 'MANUAL_ADJUSTMENT';
export type ExpenseCategory = 'FIXED' | 'VARIABLE';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// ─── Common ───────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
}

export interface FormulaBundle {
  id: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  items: FormulaBundleItem[];
}

export interface FormulaBundleItem {
  id: string;
  bundleId: string;
  menuItemId: string;
  quantity: number;
  menuItem?: MenuItem;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerId?: string;
  customer?: AuthUser;
  employeeId?: string;
  status: OrderStatus;
  orderType: OrderType;
  tableId?: string;
  tableNumber?: number;
  notes?: string;
  billNumber?: string;
  billedAt?: string;
  subtotal: number;
  tax: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  isActive: boolean;
  items: CartItem[];
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  orderId: string;
  order?: Order;
  userId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  createdAt: string;
}

export interface DailyClosing {
  closedDate: string;
  expectedCash: number;
  actualCash: number;
  discrepancy: number;
  totalRevenue: number;
  totalPayments: number;
  notes?: string;
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export interface DiningTable {
  id: string;
  code: string;
  seats: number;
  status: TableStatus;
  assignedWaiterId?: string;
  assignedWaiter?: AuthUser;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  userId?: string;
  user?: AuthUser;
  tableId: string;
  table?: DiningTable;
  guestCount: number;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  notes?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  imageUrl?: string;
  unit: string;
  minStockLevel: number;
  defaultSupplierId?: string;
  inventory?: { currentStock: number };
}

export interface InventoryItem {
  id: string;
  ingredientId: string;
  ingredient: Ingredient;
  currentStock: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredient?: Ingredient;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
}

// ─── Procurement ──────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export interface SupplierOrderItem {
  supplierOrderId: string;
  ingredientId: string;
  ingredient?: Ingredient;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  status: SupplierOrderStatus;
  notes?: string;
  orderedAt: string;
  receivedAt?: string;
  totalAmount: number;
  items: SupplierOrderItem[];
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  user?: AuthUser;
  orderId: string;
  orderItemId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export interface LoyaltyAccount {
  userId: string;
  points: number;
  lifetimePoints: number;
  completedOrders: number;
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  userId: string;
  orderId?: string;
  type: LoyaltyTransactionType;
  pointsDelta: number;
  balanceAfter: number;
  reason?: string;
  createdAt: string;
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  notes?: string;
  paidById?: string;
  createdAt: string;
}

export interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
}

export interface MonthlyProfit {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  ordersByType: { type: string; count: number }[];
}

// ─── Client Profile ───────────────────────────────────────────────────────────

export interface ClientAddress {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface ClientPreference {
  id: string;
  userId: string;
  dietaryRestrictions?: string;
  allergens?: string;
  preferredDeliveryNotes?: string;
  marketingOptIn: boolean;
}
