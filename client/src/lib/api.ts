import { apiRequest } from "./queryClient";

export const api = {
  // Product methods
  getProducts: (filters?: { class?: string; sort?: string }) => {
    const params = new URLSearchParams();
    if (filters?.class) params.append("class", filters.class);
    if (filters?.sort) params.append("sort", filters.sort);
    return fetch(`/api/products?${params}`).then(res => res.json());
  },

  likeProduct: (productId: string) => {
    return apiRequest("POST", `/api/products/${productId}/like`);
  },

  // Order methods
  createOrder: (orderData: any) => {
    return apiRequest("POST", "/api/orders", orderData);
  },

  // Seller methods
  createProduct: (formData: FormData) => {
    return fetch("/api/sellers", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  },

  getSellerProducts: (sellerId: string) => {
    return fetch(`/api/sellers/${sellerId}/products`).then(res => res.json());
  },

  // Admin methods
  adminLogin: (credentials: { username: string; password: string }) => {
    return apiRequest("POST", "/api/admin/login", { body: credentials });
  },

  setupTotp: () => {
    return apiRequest("POST", "/api/admin/setup-totp");
  },

  verifyTotp: (token: string) => {
    return apiRequest("POST", "/api/admin/verify-totp", { body: { token } });
  },

  adminLogout: () => {
    return apiRequest("POST", "/api/admin/logout");
  },

  getAdminStats: () => {
    return fetch("/api/admin/stats", { credentials: "include" }).then(res => res.json());
  },

  getAdminOrders: () => {
    return fetch("/api/admin/orders", { credentials: "include" }).then(res => res.json());
  },

  confirmOrder: (orderId: string) => {
    return apiRequest("POST", `/api/admin/orders/${orderId}/confirm`);
  },

  cancelOrder: (orderId: string) => {
    return apiRequest("POST", `/api/admin/orders/${orderId}/cancel`);
  },
};
