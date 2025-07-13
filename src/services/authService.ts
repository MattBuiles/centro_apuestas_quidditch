import { apiClient } from '../utils/apiClient';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export class AuthService {
  private currentUser: User | null = null;
  private static instance: AuthService;

  constructor() {
    // Initialize auth from stored token
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initializeAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.setToken(token);
      // Note: In production, we should validate the token with the backend
    }
  }

  async loginForDevelopment(): Promise<boolean> {
    try {
      // First try to register the test user (it will fail if already exists, which is fine)
      try {
        await apiClient.post('/auth/register', {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      } catch {
        // User already exists, which is fine
        console.log('Test user already exists, proceeding with login');
      }

      // Now login
      const response = await apiClient.post('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      }) as { data: AuthResponse };

      if (response.data && response.data.tokens) {
        const { user, tokens } = response.data;
        
        // Store the access token
        apiClient.setToken(tokens.accessToken);
        this.currentUser = user;
        
        console.log('✅ Development authentication successful:', user.username);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Development authentication failed:', error);
      return false;
    }
  }

  async ensureAuthenticated(): Promise<boolean> {
    // Check if we already have a valid token
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('✅ Auth token found in localStorage');
      return true;
    }

    console.log('🔐 No auth token found, attempting auto-login for development...');
    // For development, automatically login with test user
    return await this.loginForDevelopment();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
    apiClient.setToken('');
    this.currentUser = null;
  }
}

export const authService = AuthService.getInstance();
