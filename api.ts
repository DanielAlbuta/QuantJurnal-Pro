import { Trade, UserProfile } from './types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('🚀 API Base URL:', API_BASE_URL);

// Token Management
export const getToken = (): string | null => {
    return localStorage.getItem('qj_token');
};

export const setToken = (token: string): void => {
    localStorage.setItem('qj_token', token);
};

export const removeToken = (): void => {
    localStorage.removeItem('qj_token');
};

// API Request Helper
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// ============ AUTH API ============

interface AuthResponse {
    success: boolean;
    token: string;
    user: UserProfile & { id: string; email: string };
}

interface UserResponse {
    success: boolean;
    user: UserProfile & { id: string; email: string };
}

export const api = {
    // Register new user
    async register(name: string, email: string, password: string): Promise<AuthResponse> {
        return apiRequest<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
    },

    // Login user
    async login(email: string, password: string): Promise<AuthResponse> {
        return apiRequest<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    // Get current user
    async getMe(): Promise<UserResponse> {
        return apiRequest<UserResponse>('/auth/me');
    },

    // ============ PROFILE API ============

    // Update profile
    async updateProfile(profileData: Partial<UserProfile>): Promise<UserResponse> {
        return apiRequest<UserResponse>('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    },

    // ============ TRADES API ============

    // Get all trades
    async getTrades(): Promise<{ success: boolean; trades: Trade[] }> {
        return apiRequest('/trades');
    },

    // Create trade
    async createTrade(trade: Omit<Trade, 'id'>): Promise<{ success: boolean; trade: Trade }> {
        return apiRequest('/trades', {
            method: 'POST',
            body: JSON.stringify(trade),
        });
    },

    // Update trade
    async updateTrade(id: string, trade: Partial<Trade>): Promise<{ success: boolean; trade: Trade }> {
        return apiRequest(`/trades/${id}`, {
            method: 'PUT',
            body: JSON.stringify(trade),
        });
    },

    // Delete trade
    async deleteTrade(id: string): Promise<{ success: boolean; message: string }> {
        return apiRequest(`/trades/${id}`, {
            method: 'DELETE',
        });
    },

    // Delete all trades
    async deleteAllTrades(): Promise<{ success: boolean; message: string; count: number }> {
        return apiRequest('/trades', {
            method: 'DELETE',
        });
    },

    // Import trades (bulk create)
    async importTrades(trades: Trade[]): Promise<{ success: boolean; imported: number }> {
        // Import trades one by one (backend doesn't have bulk endpoint)
        let imported = 0;
        for (const trade of trades) {
            try {
                // Remove id as MongoDB will generate new ones
                const { id, ...tradeData } = trade;
                await this.createTrade(tradeData);
                imported++;
            } catch (error) {
                console.error('Failed to import trade:', error);
            }
        }
        return { success: true, imported };
    },
};

export default api;
