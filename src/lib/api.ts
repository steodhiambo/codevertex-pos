const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
};

export default apiFetch;
