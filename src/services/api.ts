import { Task, TaskList, TaskQueryParams, User } from '../types';

const API_ORIGIN = import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '';
const BASE_URL = `${API_ORIGIN}/api`;

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  token?: string;
  data?: T;
  user?: User;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  allCompleted?: boolean;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  
  const storedToken = localStorage.getItem('taskify_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Crucial for HTTP-only cookie auth
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({
    success: false,
    message: 'An unexpected response was received from the server',
  }));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg) as Error & { status: number; data: any };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  // If token received, store in localStorage as well
  if (data.token) {
    localStorage.setItem('taskify_token', data.token);
  }

  return data;
}

// Authentication API
export const authApi = {
  register: (name: string, email: string, password: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: async () => {
    localStorage.removeItem('taskify_token');
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  getMe: () => request('/auth/me', { method: 'GET' }),
};

// Task List API
export const taskListApi = {
  getAll: () => request<TaskList[]>('/tasklists', { method: 'GET' }),

  getById: (id: string) => request<TaskList>(`/tasklists/${id}`, { method: 'GET' }),

  create: (name: string, description?: string) =>
    request<TaskList>('/tasklists', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  update: (id: string, name: string, description?: string) =>
    request<TaskList>(`/tasklists/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    }),

  delete: (id: string) =>
    request(`/tasklists/${id}`, {
      method: 'DELETE',
    }),

  reorder: (listIds: string[]) =>
    request('/tasklists/reorder', {
      method: 'PUT',
      body: JSON.stringify({ listIds }),
    }),
};

// Task API
export const taskApi = {
  getByList: (listId: string, params: TaskQueryParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params.priority && params.priority !== 'all') searchParams.append('priority', params.priority);
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const qs = searchParams.toString();
    const endpoint = `/tasklists/${listId}/tasks${qs ? `?${qs}` : ''}`;
    return request<Task[]>(endpoint, { method: 'GET' });
  },

  create: (listId: string, taskData: { name?: string; title?: string; number?: number; description?: string; priority?: string; dueDate?: string | null }) =>
    request<Task>(`/tasklists/${listId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  createBulk: (
    listId: string,
    tasks: Array<{
      name: string;
      number?: number;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
    }>
  ) =>
    request<Task[]>(`/tasklists/${listId}/tasks/bulk`, {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }),

  getById: (taskId: string) => request<Task>(`/tasks/${taskId}`, { method: 'GET' }),

  update: (taskId: string, taskData: Partial<Task>) =>
    request<Task>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),

  toggleStatus: (taskId: string, status?: string) =>
    request<Task>(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(status ? { status } : {}),
    }),

  delete: (taskId: string) =>
    request(`/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  getRandomTask: (listId: string, excludeIds: string[] = []) => {
    const qs = excludeIds.length > 0 ? `?exclude=${encodeURIComponent(excludeIds.join(','))}` : '';
    return request<Task>(`/tasklists/${listId}/random${qs}`, {
      method: 'GET',
    });
  },
};
