export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskList {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  taskCount?: number;
  completedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  _id: string;
  taskListId: string;
  number: number;
  name: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'priority' | 'dueDate';
  page?: number;
  limit?: number;
}
