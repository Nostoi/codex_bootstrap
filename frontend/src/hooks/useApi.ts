import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Example API types
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

export interface ApiTask {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string;
}

// Planning API types
export interface DailyPlanResponse {
  date: string;
  scheduleBlocks: ScheduleBlock[];
  unscheduledTasks: TaskSummary[];
  totalEstimatedMinutes: number;
  energyOptimization: number;
  focusOptimization: number;
  deadlineRisk: number;
}

export interface ScheduleBlock {
  startTime: string;
  endTime: string;
  task: TaskSummary;
  energyMatch: number;
  focusMatch: number;
  reasoning: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  description?: string;
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  focusType?: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';
  estimatedMinutes?: number;
  priority?: number;
  hardDeadline?: string;
}

// Calendar Event types
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  source: 'google' | 'outlook';
  description?: string;
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  focusType?: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';
  isAllDay: boolean;
}

export interface CalendarEventsResponse {
  date: string;
  events: CalendarEvent[];
  totalEvents: number;
  sources: {
    google: number;
    outlook: number;
  };
}

// Query keys
export const queryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  health: ['health'] as const,
  tasks: ['tasks'] as const,
  task: (id: number) => ['tasks', id] as const,
  dailyPlan: (date: string) => ['planning', 'daily', date] as const,
  calendarEvents: (date: string) => ['planning', 'calendar-events', date] as const,
};

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.get<{ status: string; timestamp: string }>('/health'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Users hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api.get<User[]>('/users'),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserInput) => api.post<User>('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...userData }: { id: string } & Partial<CreateUserInput>) =>
      api.put<User>(`/users/${id}`, userData),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(data.id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

// Tasks hooks
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => api.get<ApiTask[]>('/tasks'),
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.patch<ApiTask>(`/tasks/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

// Planning hooks
export function useDailyPlan(date?: string) {
  const planDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: queryKeys.dailyPlan(planDate),
    queryFn: () => api.get<DailyPlanResponse>(`/plans/today${date ? `?date=${date}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useRefreshDailyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date?: string) => {
      const planDate = date || new Date().toISOString().split('T')[0];
      return api.get<DailyPlanResponse>(`/plans/today?date=${planDate}`);
    },
    onSuccess: (data, variables) => {
      const mutationPlanDate = variables || new Date().toISOString().split('T')[0];
      queryClient.setQueryData(queryKeys.dailyPlan(mutationPlanDate), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyPlan(mutationPlanDate) });
    },
  });
}

// Calendar Events hooks
export function useCalendarEvents(date?: string) {
  const eventDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: queryKeys.calendarEvents(eventDate),
    queryFn: () =>
      api.get<CalendarEventsResponse>(`/plans/calendar-events${date ? `?date=${date}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useRefreshCalendarEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date?: string) => {
      const eventDate = date || new Date().toISOString().split('T')[0];
      return api.get<CalendarEventsResponse>(`/plans/calendar-events?date=${eventDate}`);
    },
    onSuccess: (data, variables) => {
      const mutationEventDate = variables || new Date().toISOString().split('T')[0];
      queryClient.setQueryData(queryKeys.calendarEvents(mutationEventDate), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarEvents(mutationEventDate) });
    },
  });
}
