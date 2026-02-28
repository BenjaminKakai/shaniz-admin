// =============================================================================
// SHANIZ GAMING ADMIN - API SERVICE
// =============================================================================

import axios from 'axios';
import type {
  DashboardStats,
  GameSession,
  GameStats,
  LeaderboardEntry,
  PaginatedResponse,
  RevenueData,
  Tournament,
  Transaction,
  User,
  GameType,
  Report,
  AntiCheatEvent,
  AdminAction,
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://16.60.164.64:4065/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// AUTH
// =============================================================================

export const authService = {
  login: async (email: string, password: string) => {
    // Admin login with email and password at /admin/login
    const response = await api.post('/admin/login', { email, password });
    // Response format: { success, data: { token, refreshToken, user } }
    const data = response.data.data || response.data;
    return {
      token: data.token || data.accessToken,
      user: {
        id: data.user.id,
        email: data.user.email || data.user.username,
        name: data.user.username,
        role: data.user.role,
      }
    };
  },

  logout: () => {
    localStorage.removeItem('admin_token');
  },

  getCurrentUser: async () => {
    const response = await api.get('/admin/me');
    const data = response.data.data || response.data;
    return {
      id: data.id,
      email: data.email || data.username,
      name: data.username,
      role: data.role,
    };
  },
};

// =============================================================================
// DASHBOARD
// =============================================================================

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard');
    const data = response.data.data || response.data;
    // Map backend response to frontend expected format
    return {
      totalUsers: data.users?.total || 0,
      activeUsers: data.users?.active || 0,
      totalGames: data.sessions?.total || 0,
      gamesInProgress: data.sessions?.active || 0,
      totalRevenue: data.transactions?.total || 0,
      todayRevenue: data.sessions?.today || 0,
      totalTournaments: data.tournaments?.total || 0,
      activeTournaments: data.tournaments?.active || 0,
    } as DashboardStats;
  },

  getGameStats: async (): Promise<GameStats[]> => {
    try {
      const response = await api.get('/admin/dashboard/game-stats');
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch game stats:', error);
      return [];
    }
  },

  getRevenueData: async (days: number = 30): Promise<RevenueData[]> => {
    try {
      const response = await api.get(`/admin/dashboard/revenue?days=${days}`);
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      return [];
    }
  },
};

// =============================================================================
// USERS
// =============================================================================

export const userService = {
  getAll: async (page = 1, limit = 20, search?: string): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    const response = await api.get(`/admin/users?${params}`);
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data.data || response.data;
  },

  suspend: async (id: string, reason: string): Promise<void> => {
    await api.post(`/admin/users/${id}/suspend`, { reason });
  },

  unsuspend: async (id: string): Promise<void> => {
    await api.post(`/admin/users/${id}/unsuspend`);
  },

  ban: async (id: string, reason: string, duration?: number): Promise<void> => {
    await api.post(`/admin/users/${id}/ban`, { reason, duration });
  },

  unban: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}/ban`);
  },

  updateRole: async (id: string, role: string): Promise<void> => {
    await api.patch(`/admin/users/${id}/role`, { role });
  },
};

// =============================================================================
// GAMES (Sessions)
// =============================================================================

export const gameService = {
  getAll: async (
    page = 1,
    limit = 20,
    gameType?: GameType,
    status?: string,
    search?: string
  ): Promise<PaginatedResponse<GameSession>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (gameType) params.append('gameType', gameType);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const response = await api.get(`/admin/games/sessions?${params}`);
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<GameSession> => {
    const response = await api.get(`/admin/sessions/${id}/replay`);
    return response.data.data || response.data;
  },

  cancel: async (id: string, reason: string, refundPlayers?: boolean): Promise<void> => {
    await api.post(`/admin/games/sessions/${id}/cancel`, { reason, refundPlayers });
  },

  getActiveGames: async (): Promise<GameSession[]> => {
    const response = await api.get('/admin/sessions');
    const data = response.data.data || response.data;
    return data.sessions || data;
  },

  // Game configurations
  getConfigs: async () => {
    const response = await api.get('/admin/games');
    return response.data.data || response.data;
  },

  updateConfig: async (gameId: string, config: any) => {
    const response = await api.patch(`/admin/games/${gameId}`, config);
    return response.data.data || response.data;
  },
};

// =============================================================================
// TOURNAMENTS
// =============================================================================

export const tournamentService = {
  getAll: async (page = 1, limit = 20, status?: string): Promise<PaginatedResponse<Tournament>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const response = await api.get(`/admin/tournaments?${params}`);
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Tournament> => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: Partial<Tournament>): Promise<Tournament> => {
    const response = await api.post('/tournaments', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<Tournament>): Promise<Tournament> => {
    const response = await api.patch(`/tournaments/${id}`, data);
    return response.data.data || response.data;
  },

  cancel: async (id: string, reason: string, refundEntries?: boolean): Promise<void> => {
    await api.post(`/admin/tournaments/${id}/cancel`, { reason, refundEntries });
  },

  start: async (id: string): Promise<void> => {
    await api.post(`/tournaments/${id}/start`);
  },

  complete: async (id: string): Promise<void> => {
    await api.post(`/admin/tournaments/${id}/complete`);
  },
};

// =============================================================================
// TRANSACTIONS
// =============================================================================

export const transactionService = {
  getAll: async (
    page = 1,
    limit = 20,
    type?: string,
    status?: string,
    search?: string
  ): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const response = await api.get(`/admin/transactions?${params}`);
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/admin/transactions/${id}`);
    return response.data.data || response.data;
  },

  approve: async (id: string, notes?: string): Promise<void> => {
    await api.post(`/admin/transactions/${id}/approve`, { notes });
  },

  reject: async (id: string, reason: string): Promise<void> => {
    await api.post(`/admin/transactions/${id}/reject`, { reason });
  },
};

// =============================================================================
// REPORTS
// =============================================================================

export const reportService = {
  getAll: async (
    page = 1,
    limit = 20,
    status?: string
  ): Promise<PaginatedResponse<Report>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const response = await api.get(`/admin/reports?${params}`);
    return response.data.data || response.data;
  },

  review: async (
    id: string,
    status: string,
    resolution: string,
    banUser?: boolean,
    banDuration?: number
  ): Promise<void> => {
    await api.post(`/admin/reports/${id}/review`, {
      status,
      resolution,
      banUser,
      banDuration,
    });
  },
};

// =============================================================================
// ANTI-CHEAT
// =============================================================================

export const antiCheatService = {
  getAll: async (
    page = 1,
    limit = 20,
    severity?: string,
    isReviewed?: boolean
  ): Promise<PaginatedResponse<AntiCheatEvent>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (severity) params.append('severity', severity);
    if (isReviewed !== undefined) params.append('isReviewed', String(isReviewed));
    const response = await api.get(`/admin/anticheat?${params}`);
    return response.data.data || response.data;
  },

  review: async (
    id: string,
    action: string,
    banUser?: boolean,
    banDuration?: number
  ): Promise<void> => {
    await api.post(`/admin/anticheat/${id}/review`, {
      action,
      banUser,
      banDuration,
    });
  },
};

// =============================================================================
// ADMIN ACTIONS (AUDIT LOG)
// =============================================================================

export const auditService = {
  getAll: async (
    page = 1,
    limit = 50,
    adminId?: string,
    action?: string
  ): Promise<PaginatedResponse<AdminAction>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (adminId) params.append('adminId', adminId);
    if (action) params.append('action', action);
    const response = await api.get(`/admin/actions?${params}`);
    return response.data.data || response.data;
  },
};

// =============================================================================
// SYSTEM CONFIG
// =============================================================================

export const configService = {
  getAll: async (): Promise<Record<string, any>> => {
    try {
      const response = await api.get('/admin/games');
      const data = response.data.data || response.data;
      // Return game configs as system config
      return data || {};
    } catch {
      // Return empty config if endpoint doesn't exist
      return {};
    }
  },

  get: async (key: string): Promise<any> => {
    try {
      const response = await api.get(`/admin/games/${key}`);
      return response.data.data || response.data;
    } catch {
      return null;
    }
  },

  update: async (key: string, value: any): Promise<void> => {
    await api.patch(`/admin/games/${key}`, value);
  },
};

// =============================================================================
// ANNOUNCEMENTS
// =============================================================================

export const announcementService = {
  create: async (
    title: string,
    message: string,
    type?: string,
    broadcast?: boolean
  ): Promise<void> => {
    await api.post('/admin/announcements', { title, message, type, broadcast });
  },
};

// =============================================================================
// LEADERBOARD
// =============================================================================

export const leaderboardService = {
  getGlobal: async (gameType: GameType, limit = 100): Promise<LeaderboardEntry[]> => {
    const response = await api.get(`/leaderboard/game/${gameType}?limit=${limit}`);
    return response.data.data || response.data;
  },
};

export default api;
