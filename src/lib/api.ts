const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws').replace('/api', '/ws');

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

export const authApi = {
  login: (pin: string) => apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  }),
};

export const menuApi = {
  getAll: () => apiFetch('/menu'),
  getCategories: () => apiFetch('/categories'),
};

export const tableApi = {
  getAll: () => apiFetch('/tables'),
  updateStatus: (id: string, status: string) => apiFetch(`/tables/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

export const orderApi = {
  create: (orderData: any) => apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
  getAll: () => apiFetch('/orders'),
  getByTable: (tableId: string) => apiFetch(`/orders/table/${tableId}`),
  getByWaiter: (waiterId: string) => apiFetch(`/orders/by-waiter/${waiterId}`),
  updateStatus: (id: string, status: string) => apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  toggleItem: (itemId: string, is_cooked: boolean) => apiFetch(`/orders/items/${itemId}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ is_cooked }),
  }),
};

export const userApi = {
  getAll: () => apiFetch('/users'),
  create: (user: { full_name: string; role: string; pin?: string }) => apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  toggleActive: (id: string, is_active: boolean) => apiFetch(`/users/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  }),
};

export const getWsUrl = (endpoint: string) => `${WS_BASE_URL}${endpoint}`;

export default apiFetch;
