// =============================================================================
// SHANIZ GAMING ADMIN - TYPE DEFINITIONS
// =============================================================================

// User Types
export interface User {
  id: string;
  externalUserId: string;
  username: string;
  email?: string | null;
  phoneNumber?: string | null;
  profilePicture?: string | null;
  balance?: number;
  totalGames?: number;
  wins?: number;
  losses?: number;
  createdAt: string;
  updatedAt?: string;
  lastActive?: string | null;
  status?: 'active' | 'suspended' | 'banned';
  role: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  isBanned: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  bannedUntil?: string | null;
  _count?: {
    sessionsAsPlayer1?: number;
    sessionsAsPlayer2?: number;
    reports?: number;
    antiCheatEvents?: number;
  };
}

// Game Types
export type GameType =
  | 'POOL'
  | 'MINI_GOLF'
  | 'UNO_FLIP'
  | 'SIMPLE_CARDS'
  | 'WORD'
  | 'WORD_HUNT'
  | 'ANAGRAMS'
  | 'CHESS'
  | 'CHECKERS'
  | 'LUDO';

export interface GameSession {
  id: string;
  gameType: GameType;
  player1Id: string;
  player1Name?: string;
  player1?: { id: string; username: string };
  player2Id?: string;
  player2Name?: string;
  player2?: { id: string; username: string };
  stake: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'WAITING';
  winnerId?: string;
  winner?: { id: string; username: string };
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  completedAt?: string;
  duration?: number; // in seconds
  gameState?: any;
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  gameType: GameType;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REGISTRATION';
  startDate: string;
  endDate?: string;
  createdAt: string;
  winnerId?: string;
  winner?: { id: string; username: string };
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  rank?: number;
  eliminated: boolean;
  winnings: number;
  joinedAt: string;
}

// Transaction Types
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'STAKE'
  | 'WINNING'
  | 'REFUND'
  | 'TOURNAMENT_ENTRY'
  | 'TOURNAMENT_PRIZE';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: string;
  userId: string;
  username?: string;
  user?: { id: string; username: string };
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference?: string;
  description?: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  metadata?: any;
}

// Analytics Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  gamesInProgress: number;
  totalRevenue: number;
  todayRevenue: number;
  totalTournaments: number;
  activeTournaments: number;
}

export interface GameStats {
  gameType: GameType;
  totalGames: number;
  activeGames: number;
  totalStake: number;
  avgDuration: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  transactions: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profilePicture?: string;
  elo: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarnings: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  data?: T[];
  // Backend may return different field names for different entities
  users?: T[];
  reports?: T[];
  events?: T[];
  actions?: T[];
  sessions?: T[];
  transactions?: T[];
  tournaments?: T[];
  // Pagination info
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pages?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Report Types
export type ReportType = 'CHEATING' | 'HARASSMENT' | 'ABUSE' | 'DISCONNECTION_ABUSE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  sessionId?: string;
  reporterId: string;
  reportedUserId: string;
  reporter?: { id: string; username: string };
  reportedUser?: { id: string; username: string };
  session?: { id: string; gameType: GameType };
  type: ReportType;
  status: ReportStatus;
  description: string;
  evidence?: any;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// Anti-Cheat Types
export type AntiCheatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AntiCheatEvent {
  id: string;
  sessionId?: string;
  userId: string;
  user?: { id: string; username: string };
  session?: { id: string; gameType: GameType };
  eventType: string;
  riskScore: number;
  severity: AntiCheatSeverity;
  reason: string;
  metadata?: any;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  actionTaken?: string;
  createdAt: string;
}

// Admin Action (Audit Log) Types
export interface AdminAction {
  id: string;
  adminId: string;
  admin?: { id: string; username: string };
  targetId?: string;
  target?: { id: string; username: string };
  action: string;
  entityType: string;
  entityId?: string;
  reason?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Admin User Types
export interface AdminUser {
  id: string;
  externalUserId: string;
  username: string;
  email?: string;
  role: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
}
