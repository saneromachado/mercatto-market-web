export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER" | "STOCKER";
};

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: string | number;
  stock: number;
  minimumStock: number;
  active: boolean;
  categoryId: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
};

export type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
  product?: Product;
};

export type Sale = {
  id: string;
  number: number;
  status: "COMPLETED" | "CANCELLED";
  paymentMethod: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX";
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  createdAt: string;
  cancelledAt?: string | null;
  user?: User;
  items: SaleItem[];
};

export type Movement = {
  id: string;
  productId: string;
  product?: Product;
  type: "ENTRY" | "EXIT" | "ADJUSTMENT" | "SALE" | "SALE_CANCELLATION";
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string;
  createdAt: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: User;
};

const defaultApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export class MarketApi {
  private token: string | null = null;
  private baseUrl = defaultApiUrl.replace(/\/$/, "");

  public setToken(token: string | null) {
    this.token = token;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, "");
  }

  public getBaseUrl() {
    return this.baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;
      const rawMessage = payload?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Não foi possível concluir a operação.";
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  public login(email: string, password: string) {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  public health() {
    return this.request<{ status: string; timestamp: string }>("/health");
  }

  public products(search = "") {
    const query = new URLSearchParams({ limit: "100" });
    if (search) query.set("search", search);
    return this.request<Paginated<Product>>(`/products?${query}`);
  }

  public createProduct(input: {
    name: string;
    sku: string;
    barcode: string;
    price: number;
    minimumStock: number;
    categoryId: string;
  }) {
    return this.request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  public categories() {
    return this.request<Category[]>("/categories");
  }

  public createCategory(input: { name: string; description?: string }) {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  public lowStock() {
    return this.request<Product[]>("/inventory/low-stock");
  }

  public movements() {
    return this.request<Paginated<Movement>>("/inventory/movements?limit=50");
  }

  public createMovement(input: {
    productId: string;
    type: "ENTRY" | "EXIT" | "ADJUSTMENT";
    quantity: number;
    reason: string;
  }) {
    return this.request<Movement>("/inventory/movements", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  public sales() {
    return this.request<Paginated<Sale>>("/sales?limit=100");
  }

  public createSale(input: {
    paymentMethod: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX";
    discount: number;
    items: { productId: string; quantity: number }[];
  }) {
    return this.request<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  public cancelSale(id: string) {
    return this.request<Sale>(`/sales/${id}/cancel`, { method: "POST" });
  }
}

export const marketApi = new MarketApi();
