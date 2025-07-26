import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Example API types
interface User {
  id: string
  name: string
  email: string
}

interface CreateUserInput {
  name: string
  email: string
}

export interface ApiTask {
  id: number
  title: string
  completed: boolean
}

// Query keys
export const queryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  health: ['health'] as const,
  tasks: ['tasks'] as const,
  task: (id: number) => ['tasks', id] as const,
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.get<{ status: string; timestamp: string }>('/health'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Users hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api.get<User[]>('/users'),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: CreateUserInput) => 
      api.post<User>('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...userData }: { id: string } & Partial<CreateUserInput>) =>
      api.put<User>(`/users/${id}`, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      queryClient.invalidateQueries({ queryKey: queryKeys.user(data.id) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

// Tasks hooks
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => api.get<ApiTask[]>('/tasks'),
  })
}

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.patch<ApiTask>(`/tasks/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}
