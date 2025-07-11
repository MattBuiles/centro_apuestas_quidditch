import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/apiClient';
import { FEATURES } from '../config/features';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: 'user' | 'admin';
  avatar?: string;
}

// Interfaz para las apuestas del usuario
interface UserBet {
  id: string;
  userId: string;
  matchId: string;
  matchName: string;
  options: BetOption[];
  amount: number;
  combinedOdds: number;
  potentialWin: number;
  date: string;
  status: 'active' | 'won' | 'lost';
}

// Interfaz para las opciones de apuesta
interface BetOption {
  id: string;
  type: string;
  selection: string;
  odds: number;
  description: string;
  matchId: string;
}

// Interfaz para almacenar credenciales de usuario (separada por seguridad)
interface UserCredentials {
  userId: string;
  password: string;
}

// Interfaz para cuentas completas con credenciales
interface UserAccount {
  user: User;
  password: string;
}

// Interfaz para las transacciones del usuario
interface UserTransaction {
  id: number;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  amount: number;
  date: string;
  description: string;
  userId: string;
}

// 5 cuentas predefinidas
const PREDEFINED_ACCOUNTS: UserAccount[] = [
  {
    user: {
      id: 'admin',
      username: 'Administrador Mágico',
      email: 'admin@quidditch.com',
      balance: 0,
      role: 'admin',
      avatar: '/src/assets/User_Logo.png',
    },
    password: 'admin123'
  },
  {
    user: {
      id: 'user1',
      username: 'Harry Potter',
      email: 'harry@gryffindor.com',
      balance: 250,
      role: 'user',
      avatar: '/src/assets/Gryffindor_Logo.png',
    },
    password: 'patronus123'
  },
  {
    user: {
      id: 'user2',
      username: 'Hermione Granger',
      email: 'hermione@gryffindor.com',
      balance: 180,
      role: 'user',
      avatar: '/src/assets/Gryffindor_Logo.png',
    },
    password: 'magic456'
  },
  {
    user: {
      id: 'user3',
      username: 'Draco Malfoy',
      email: 'draco@slytherin.com',
      balance: 320,
      role: 'user',
      avatar: '/src/assets/Slytherin_Logo.png',
    },
    password: 'serpent789'
  },
  {
    user: {
      id: 'user4',
      username: 'Luna Lovegood',
      email: 'luna@ravenclaw.com',
      balance: 95,
      role: 'user',
      avatar: '/src/assets/Ravenclaw_Logo.png',
    },
    password: 'nargles321'
  },
  {
    user: {
      id: 'user5',
      username: 'Cedric Diggory',
      email: 'cedric@hufflepuff.com',
      balance: 140,
      role: 'user',
      avatar: '/src/assets/Hufflepuff_Logo.png',
    },
    password: 'champion987'
  }
];

// Historial de transacciones simulado para usuarios predefinidos
const PREDEFINED_TRANSACTIONS: Record<string, UserTransaction[]> = {
  'user1': [ // Harry Potter
    { id: 1, type: 'deposit', amount: 500, date: '2025-06-15', description: 'Depósito inicial de Gringotts', userId: 'user1' },
    { id: 2, type: 'bet', amount: -50, date: '2025-06-16', description: 'Apuesta: Gryffindor vs Slytherin', userId: 'user1' },
    { id: 3, type: 'win', amount: 100, date: '2025-06-16', description: 'Ganancia: Gryffindor vs Slytherin', userId: 'user1' },
    { id: 4, type: 'bet', amount: -30, date: '2025-06-18', description: 'Apuesta: Ravenclaw vs Hufflepuff', userId: 'user1' },
    { id: 5, type: 'bet', amount: -25, date: '2025-06-20', description: 'Apuesta: Holyhead Harpies vs Chudley Cannons', userId: 'user1' },
    { id: 6, type: 'withdraw', amount: -70, date: '2025-06-21', description: 'Retiro de 70 galeones a Gringotts', userId: 'user1' }
  ],
  'user2': [ // Hermione Granger
    { id: 7, type: 'deposit', amount: 400, date: '2025-06-14', description: 'Depósito inicial de Gringotts', userId: 'user2' },
    { id: 8, type: 'bet', amount: -40, date: '2025-06-15', description: 'Apuesta: Gryffindor vs Ravenclaw', userId: 'user2' },
    { id: 9, type: 'win', amount: 80, date: '2025-06-15', description: 'Ganancia: Gryffindor vs Ravenclaw', userId: 'user2' },
    { id: 10, type: 'bet', amount: -35, date: '2025-06-17', description: 'Apuesta: Hufflepuff vs Slytherin', userId: 'user2' },
    { id: 11, type: 'bet', amount: -20, date: '2025-06-19', description: 'Apuesta: Chudley Cannons vs Holyhead Harpies', userId: 'user2' },
    { id: 12, type: 'withdraw', amount: -45, date: '2025-06-22', description: 'Retiro de 45 galeones a Gringotts', userId: 'user2' }
  ],
  'user3': [ // Draco Malfoy
    { id: 13, type: 'deposit', amount: 800, date: '2025-06-13', description: 'Depósito inicial de Gringotts', userId: 'user3' },
    { id: 14, type: 'bet', amount: -100, date: '2025-06-14', description: 'Apuesta: Slytherin vs Gryffindor', userId: 'user3' },
    { id: 15, type: 'win', amount: 180, date: '2025-06-14', description: 'Ganancia: Slytherin vs Gryffindor', userId: 'user3' },
    { id: 16, type: 'bet', amount: -60, date: '2025-06-16', description: 'Apuesta: Slytherin vs Ravenclaw', userId: 'user3' },
    { id: 17, type: 'bet', amount: -80, date: '2025-06-18', description: 'Apuesta: Holyhead Harpies vs Chudley Cannons', userId: 'user3' },
    { id: 18, type: 'win', amount: 140, date: '2025-06-18', description: 'Ganancia: Holyhead Harpies vs Chudley Cannons', userId: 'user3' },
    { id: 19, type: 'withdraw', amount: -200, date: '2025-06-20', description: 'Retiro de 200 galeones a Gringotts', userId: 'user3' }
  ],
  'user4': [ // Luna Lovegood
    { id: 20, type: 'deposit', amount: 300, date: '2025-06-16', description: 'Depósito inicial de Gringotts', userId: 'user4' },
    { id: 21, type: 'bet', amount: -25, date: '2025-06-17', description: 'Apuesta: Ravenclaw vs Hufflepuff', userId: 'user4' },
    { id: 22, type: 'win', amount: 50, date: '2025-06-17', description: 'Ganancia: Ravenclaw vs Hufflepuff', userId: 'user4' },
    { id: 23, type: 'bet', amount: -30, date: '2025-06-19', description: 'Apuesta: Ravenclaw vs Gryffindor', userId: 'user4' },
    { id: 24, type: 'bet', amount: -20, date: '2025-06-21', description: 'Apuesta: Chudley Cannons vs Holyhead Harpies', userId: 'user4' },
    { id: 25, type: 'withdraw', amount: -80, date: '2025-06-22', description: 'Retiro de 80 galeones a Gringotts', userId: 'user4' }
  ],
  'user5': [ // Cedric Diggory
    { id: 26, type: 'deposit', amount: 350, date: '2025-06-15', description: 'Depósito inicial de Gringotts', userId: 'user5' },
    { id: 27, type: 'bet', amount: -45, date: '2025-06-16', description: 'Apuesta: Hufflepuff vs Slytherin', userId: 'user5' },
    { id: 28, type: 'win', amount: 90, date: '2025-06-16', description: 'Ganancia: Hufflepuff vs Slytherin', userId: 'user5' },
    { id: 29, type: 'bet', amount: -35, date: '2025-06-18', description: 'Apuesta: Hufflepuff vs Gryffindor', userId: 'user5' },
    { id: 30, type: 'bet', amount: -40, date: '2025-06-20', description: 'Apuesta: Holyhead Harpies vs Chudley Cannons', userId: 'user5' },    { id: 31, type: 'withdraw', amount: -90, date: '2025-06-21', description: 'Retiro de 90 galeones a Gringotts', userId: 'user5' }
  ]
};

// Historial de apuestas simulado para usuarios predefinidos
const PREDEFINED_BETS: Record<string, UserBet[]> = {
  'user1': [ // Harry Potter
    {
      id: 'bet_harry_1',
      userId: 'user1',
      matchId: 'match_gryf_sly_01',
      matchName: 'Gryffindor vs Slytherin',
      options: [
        {
          id: 'win_gryf_1',
          type: 'winner',
          selection: 'Gryffindor',
          odds: 2.0,
          description: 'Gryffindor gana',
          matchId: 'match_gryf_sly_01'
        }
      ],
      amount: 50,
      combinedOdds: 2.0,
      potentialWin: 100,
      date: '2025-06-16T10:30:00.000Z',
      status: 'won'
    },
    {
      id: 'bet_harry_2',
      userId: 'user1',
      matchId: 'match_rav_huff_01',
      matchName: 'Ravenclaw vs Hufflepuff',
      options: [
        {
          id: 'win_rav_1',
          type: 'winner',
          selection: 'Ravenclaw',
          odds: 1.8,
          description: 'Ravenclaw gana',
          matchId: 'match_rav_huff_01'
        }
      ],
      amount: 30,
      combinedOdds: 1.8,
      potentialWin: 54,
      date: '2025-06-18T14:15:00.000Z',
      status: 'lost'
    }
  ],
  'user2': [ // Hermione Granger
    {
      id: 'bet_hermione_1',
      userId: 'user2',
      matchId: 'match_gryf_rav_01',
      matchName: 'Gryffindor vs Ravenclaw',
      options: [
        {
          id: 'win_gryf_2',
          type: 'winner',
          selection: 'Gryffindor',
          odds: 1.9,
          description: 'Gryffindor gana',
          matchId: 'match_gryf_rav_01'
        }
      ],
      amount: 40,
      combinedOdds: 1.9,
      potentialWin: 76,
      date: '2025-06-15T16:20:00.000Z',
      status: 'won'
    },
    {
      id: 'bet_hermione_2',
      userId: 'user2',
      matchId: 'match_huff_sly_01',
      matchName: 'Hufflepuff vs Slytherin',
      options: [
        {
          id: 'score_exact_1',
          type: 'score',
          selection: '150-140',
          odds: 8.5,
          description: 'Puntuación exacta: 150-140',
          matchId: 'match_huff_sly_01'
        }
      ],
      amount: 35,
      combinedOdds: 8.5,
      potentialWin: 297.5,
      date: '2025-06-17T11:45:00.000Z',
      status: 'lost'
    }
  ],
  'user3': [ // Draco Malfoy
    {
      id: 'bet_draco_1',
      userId: 'user3',
      matchId: 'match_sly_gryf_01',
      matchName: 'Slytherin vs Gryffindor',
      options: [
        {
          id: 'win_sly_1',
          type: 'winner',
          selection: 'Slytherin',
          odds: 2.2,
          description: 'Slytherin gana',
          matchId: 'match_sly_gryf_01'
        }
      ],
      amount: 100,
      combinedOdds: 2.2,
      potentialWin: 220,
      date: '2025-06-14T13:30:00.000Z',
      status: 'won'
    },
    {
      id: 'bet_draco_2',
      userId: 'user3',
      matchId: 'match_harpies_cannons_01',
      matchName: 'Holyhead Harpies vs Chudley Cannons',
      options: [
        {
          id: 'win_harpies_1',
          type: 'winner',
          selection: 'Holyhead Harpies',
          odds: 1.75,
          description: 'Holyhead Harpies gana',
          matchId: 'match_harpies_cannons_01'
        }
      ],
      amount: 80,
      combinedOdds: 1.75,
      potentialWin: 140,
      date: '2025-06-18T15:00:00.000Z',
      status: 'won'
    }
  ],
  'user4': [ // Luna Lovegood
    {
      id: 'bet_luna_1',
      userId: 'user4',
      matchId: 'match_rav_huff_02',
      matchName: 'Ravenclaw vs Hufflepuff',
      options: [
        {
          id: 'win_rav_2',
          type: 'winner',
          selection: 'Ravenclaw',
          odds: 2.0,
          description: 'Ravenclaw gana',
          matchId: 'match_rav_huff_02'
        }
      ],
      amount: 25,
      combinedOdds: 2.0,
      potentialWin: 50,
      date: '2025-06-17T12:15:00.000Z',
      status: 'won'
    },
    {
      id: 'bet_luna_2',
      userId: 'user4',
      matchId: 'match_rav_gryf_01',
      matchName: 'Ravenclaw vs Gryffindor',
      options: [
        {
          id: 'margin_rav_1',
          type: 'margin',
          selection: '+50',
          odds: 3.5,
          description: 'Ravenclaw gana por más de 50 puntos',
          matchId: 'match_rav_gryf_01'
        }
      ],
      amount: 30,
      combinedOdds: 3.5,
      potentialWin: 105,
      date: '2025-06-19T14:45:00.000Z',
      status: 'lost'
    }
  ],
  'user5': [ // Cedric Diggory
    {
      id: 'bet_cedric_1',
      userId: 'user5',
      matchId: 'match_huff_sly_02',
      matchName: 'Hufflepuff vs Slytherin',
      options: [
        {
          id: 'win_huff_1',
          type: 'winner',
          selection: 'Hufflepuff',
          odds: 2.0,
          description: 'Hufflepuff gana',
          matchId: 'match_huff_sly_02'
        }
      ],
      amount: 45,
      combinedOdds: 2.0,
      potentialWin: 90,
      date: '2025-06-16T16:30:00.000Z',
      status: 'won'
    },
    {
      id: 'bet_cedric_2',
      userId: 'user5',
      matchId: 'match_huff_gryf_01',
      matchName: 'Hufflepuff vs Gryffindor',
      options: [
        {
          id: 'total_points_1',
          type: 'total',
          selection: 'over_300',
          odds: 2.5,
          description: 'Total de puntos mayor a 300',
          matchId: 'match_huff_gryf_01'
        }
      ],
      amount: 35,
      combinedOdds: 2.5,
      potentialWin: 87.5,
      date: '2025-06-18T10:20:00.000Z',
      status: 'lost'
    }
  ]
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  canBet: boolean;
  isBackendAuthenticated: boolean; // New property to indicate backend auth status
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string, birthdate: string) => Promise<void>;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
  updateUserProfile: (userData: Partial<Pick<User, 'username' | 'email' | 'avatar'>>) => void;
  validateCurrentPassword: (password: string) => boolean;
  validatePassword: (password: string) => string | null;
  updatePassword: (newPassword: string) => void;  // Nueva función para restablecer contraseña por email
  resetPasswordByEmail: (email: string, newPassword: string) => boolean;
  // Nueva función para obtener las cuentas predefinidas (útil para debugging)
  getPredefinedAccounts: () => { email: string; username: string; role: string }[];  // Funciones para manejo de apuestas
  placeBet: (bet: Omit<UserBet, 'id' | 'userId' | 'date' | 'status'>) => Promise<boolean>;
  getUserBets: () => UserBet[];
  getTodayBetsCount: () => number;
  canPlaceBet: (amount: number) => { canBet: boolean; reason?: string };
  // Funciones para manejo de transacciones
  getUserTransactions: () => UserTransaction[];
  addTransaction: (transaction: Omit<UserTransaction, 'id' | 'userId' | 'date'>) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);  const [error, setError] = useState<string | null>(null);
  const [currentAccounts, setCurrentAccounts] = useState<UserAccount[]>(PREDEFINED_ACCOUNTS);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>([]);
  const navigate = useNavigate();

  // Función para encontrar una cuenta por email
  const findAccountByEmail = (email: string): UserAccount | undefined => {
    return currentAccounts.find(account => account.user.email === email);
  };
  // Función para encontrar una cuenta por ID
  const findAccountById = (id: string): UserAccount | undefined => {
    return currentAccounts.find(account => account.user.id === id);
  };

  // Función para validar contraseña
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe incluir al menos una letra mayúscula';
    }
    
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe incluir al menos un número';
    }
    
    return null; // Contraseña válida
  };
  // Funciones auxiliares para manejar credenciales de manera segura (para compatibilidad con funciones existentes)
  const saveUserCredentials = (userId: string, password: string) => {
    const credentials: UserCredentials = { userId, password };
    localStorage.setItem(`credentials_${userId}`, JSON.stringify(credentials));
  };

  const clearUserCredentials = (userId: string) => {
    localStorage.removeItem(`credentials_${userId}`);
  };
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage first, then sessionStorage
        let storedUser = localStorage.getItem('user');
        let storedToken = localStorage.getItem('auth_token');
        
        if (!storedUser) {
          storedUser = sessionStorage.getItem('user');
          storedToken = sessionStorage.getItem('auth_token');
        }

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);

          if (FEATURES.USE_BACKEND_AUTH && storedToken) {
            // Verify token with backend
            try {
              apiClient.setToken(storedToken);
              const response = await apiClient.get<User>('/auth/me');
              
              if (response.success && response.data) {
                // Update user data from backend
                const backendUser: User = {
                  id: response.data.id,
                  username: response.data.username,
                  email: response.data.email,
                  balance: response.data.balance || parsedUser.balance,
                  role: response.data.role,
                  avatar: response.data.avatar || parsedUser.avatar
                };
                
                setUser(backendUser);
                
                // Update stored user data
                if (localStorage.getItem('user')) {
                  localStorage.setItem('user', JSON.stringify(backendUser));
                } else {
                  sessionStorage.setItem('user', JSON.stringify(backendUser));
                }
              } else {
                // Token invalid, clear auth data
                apiClient.clearToken();
                localStorage.removeItem('user');
                localStorage.removeItem('auth_token');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('auth_token');
              }
            } catch (error) {
              console.warn('Backend auth verification failed, using stored user data:', error);
              // Clear invalid token from apiClient
              apiClient.clearToken();
              // Also clear stored tokens since they're invalid
              localStorage.removeItem('auth_token');
              sessionStorage.removeItem('auth_token');
              // Fallback to local user data
              setUser(parsedUser);
              loadUserBets(parsedUser.id);
              loadUserTransactions(parsedUser.id);
              
              // Store flag to indicate we're using local auth fallback
              sessionStorage.setItem('auth_fallback', 'true');
            }
          } else {
            // Local authentication or no token
            setUser(parsedUser);
            loadUserBets(parsedUser.id);
            loadUserTransactions(parsedUser.id);
            
            // Store flag to indicate we're using local auth
            sessionStorage.setItem('auth_fallback', 'true');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);  const login = async (email: string, password: string, remember = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (FEATURES.USE_BACKEND_AUTH) {
        // Backend authentication
        const response = await apiClient.post<{
          user: User;
          tokens: { accessToken: string };
        }>('/auth/login', { email, password });

        if (response.success && response.data) {
          const { user: backendUser, tokens } = response.data;
          
          // Set token in apiClient
          apiClient.setToken(tokens.accessToken);
          
          // Convert backend user to our User interface
          const user: User = {
            id: backendUser.id,
            username: backendUser.username,
            email: backendUser.email,
            balance: backendUser.balance || 0,
            role: backendUser.role,
            avatar: backendUser.avatar
          };
          
          setUser(user);
          
          // Store user in localStorage/sessionStorage
          if (remember) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('auth_token', tokens.accessToken);
          } else {
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('auth_token', tokens.accessToken);
          }

          // Navigate based on role
          if (user.role === 'admin') {
            navigate('/account');
          } else {
            navigate('/');
          }
        } else {
          throw new Error('Login failed - invalid response from server');
        }
      } else {
        // Local authentication (fallback)
        const account = findAccountByEmail(email);
        
        if (!account) {
          throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
        }

        if (account.password !== password) {
          throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
        }

        // Login exitoso
        setUser(account.user);
        
        // Cargar apuestas del usuario
        loadUserBets(account.user.id);
        
        // Cargar transacciones del usuario
        loadUserTransactions(account.user.id);
        
        // Guardar credenciales del usuario
        saveUserCredentials(account.user.id, password);

        // Store user in localStorage if remember is checked
        if (remember) {
          localStorage.setItem('user', JSON.stringify(account.user));
        } else {
          sessionStorage.setItem('user', JSON.stringify(account.user));
        }

        // Navegar según el rol
        if (account.user.role === 'admin') {
          navigate('/account');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        // Network error - try local fallback
        console.warn('Backend unavailable, falling back to local authentication');
        setError('Servidor no disponible. Usando autenticación local.');
        
        try {
          const account = findAccountByEmail(email);
          
          if (!account || account.password !== password) {
            throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
          }

          setUser(account.user);
          loadUserBets(account.user.id);
          loadUserTransactions(account.user.id);
          saveUserCredentials(account.user.id, password);

          if (remember) {
            localStorage.setItem('user', JSON.stringify(account.user));
          } else {
            sessionStorage.setItem('user', JSON.stringify(account.user));
          }

          if (account.user.role === 'admin') {
            navigate('/account');
          } else {
            navigate('/');
          }
        } catch (localErr) {
          setError(localErr instanceof Error ? localErr.message : 'Error al iniciar sesión.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };  const register = async (username: string, email: string, password: string, birthdate: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validar la contraseña
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      if (FEATURES.USE_BACKEND_AUTH) {
        // Backend registration
        const response = await apiClient.post<{
          user: User;
          tokens: { accessToken: string };
        }>('/auth/register', { username, email, password, birthdate });

        if (response.success && response.data) {
          const { user: backendUser, tokens } = response.data;
          
          // Set token in apiClient
          apiClient.setToken(tokens.accessToken);
          
          // Convert backend user to our User interface
          const user: User = {
            id: backendUser.id,
            username: backendUser.username,
            email: backendUser.email,
            balance: backendUser.balance || 150, // Starting balance
            role: backendUser.role,
            avatar: backendUser.avatar || '/src/assets/User_Logo.png'
          };
          
          setUser(user);
          
          // Store user in sessionStorage
          sessionStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('auth_token', tokens.accessToken);
          
          navigate('/');
        } else {
          throw new Error('Registration failed - invalid response from server');
        }
      } else {
        // Local registration (fallback)
        // Verificar si el email ya está registrado
        const existingAccount = findAccountByEmail(email);
        if (existingAccount) {
          throw new Error('Email ya registrado');
        }

        // Crear nueva cuenta
        const newUser: User = {
          id: Date.now().toString(), // ID único basado en timestamp
          username,
          email,
          balance: 150, // Starting balance for new users
          role: 'user',
          avatar: '/src/assets/User_Logo.png',
        };

        const newAccount: UserAccount = {
          user: newUser,
          password
        };

        // Agregar la nueva cuenta a la lista de cuentas actuales
        setCurrentAccounts(prev => [...prev, newAccount]);

        setUser(newUser);
        
        // Guardar credenciales del usuario registrado
        saveUserCredentials(newUser.id, password);
        
        sessionStorage.setItem('user', JSON.stringify(newUser));
        navigate('/');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        // Network error - try local fallback
        console.warn('Backend unavailable, falling back to local registration');
        setError('Servidor no disponible. Usando registro local.');
        
        try {
          const existingAccount = findAccountByEmail(email);
          if (existingAccount) {
            throw new Error('Email ya registrado');
          }

          const newUser: User = {
            id: Date.now().toString(),
            username,
            email,
            balance: 150,
            role: 'user',
            avatar: '/src/assets/User_Logo.png',
          };

          const newAccount: UserAccount = {
            user: newUser,
            password
          };

          setCurrentAccounts(prev => [...prev, newAccount]);
          setUser(newUser);
          saveUserCredentials(newUser.id, password);
          sessionStorage.setItem('user', JSON.stringify(newUser));
          navigate('/');
        } catch (localErr) {
          setError(localErr instanceof Error ? localErr.message : 'Error al registrarse.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Error al registrarse. Por favor, inténtalo de nuevo.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };  const logout = () => {
    if (user) {
      clearUserCredentials(user.id);
    }
    
    // Clear user state
    setUser(null);
    setUserBets([]); // Limpiar apuestas al cerrar sesión
    setUserTransactions([]); // Limpiar transacciones al cerrar sesión
    
    // Clear authentication data
    if (FEATURES.USE_BACKEND_AUTH) {
      apiClient.clearToken();
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_fallback');
    
    navigate('/login');
  };
  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      
      // Update the stored user data
      const storedInLocal = localStorage.getItem('user');
      const storedInSession = sessionStorage.getItem('user');
      
      if (storedInLocal) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      if (storedInSession) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };  const updateUserProfile = (userData: Partial<Pick<User, 'username' | 'email' | 'avatar'>>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update the account in the current accounts list
      setCurrentAccounts(prev => 
        prev.map(account => 
          account.user.id === user.id 
            ? { ...account, user: updatedUser }
            : account
        )
      );
      
      // Update the stored user data
      const storedInLocal = localStorage.getItem('user');
      const storedInSession = sessionStorage.getItem('user');
      
      if (storedInLocal) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      if (storedInSession) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };
  // Función para validar la contraseña actual
  const validateCurrentPassword = (password: string): boolean => {
    if (!user) return false;
    
    // Buscar la cuenta actual en la lista de cuentas
    const account = findAccountById(user.id);
    return account ? account.password === password : false;
  };
  // Función para actualizar la contraseña
  const updatePassword = (newPassword: string) => {
    if (user) {
      // Validar la nueva contraseña
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Actualizar en la lista de cuentas actuales
      setCurrentAccounts(prev => 
        prev.map(account => 
          account.user.id === user.id 
            ? { ...account, password: newPassword }
            : account
        )
      );
      
      // También guardar en localStorage para compatibilidad
      saveUserCredentials(user.id, newPassword);
    }
  };

  // ===== FUNCIONES DE MANEJO DE APUESTAS =====
  // Cargar apuestas del usuario desde localStorage
  const loadUserBets = (userId: string) => {
    const storedBets = localStorage.getItem(`userBets_${userId}`);
    if (storedBets) {
      setUserBets(JSON.parse(storedBets));
    } else {
      // Si no hay apuestas guardadas, verificar si es un usuario predefinido
      const predefinedBets = PREDEFINED_BETS[userId];
      if (predefinedBets) {
        // Cargar apuestas simuladas para usuarios predefinidos
        setUserBets(predefinedBets);
        // Guardar las apuestas simuladas en localStorage para futuras sesiones
        localStorage.setItem(`userBets_${userId}`, JSON.stringify(predefinedBets));
      } else {
        // Usuario nuevo (registrado) - no hay historial
        setUserBets([]);
      }
    }
  };
  // Cargar transacciones del usuario desde localStorage
  const loadUserTransactions = (userId: string) => {
    const storedTransactions = localStorage.getItem(`userTransactions_${userId}`);
    if (storedTransactions) {
      setUserTransactions(JSON.parse(storedTransactions));
    } else {
      // Si no hay transacciones guardadas, verificar si es un usuario predefinido
      const predefinedTransactions = PREDEFINED_TRANSACTIONS[userId];
      if (predefinedTransactions) {
        // Cargar transacciones simuladas para usuarios predefinidos
        setUserTransactions(predefinedTransactions);
        // Guardar las transacciones simuladas en localStorage para futuras sesiones
        localStorage.setItem(`userTransactions_${userId}`, JSON.stringify(predefinedTransactions));
      } else {
        // Usuario nuevo (registrado) - no hay historial
        setUserTransactions([]);
      }
    }
  };

  // Guardar apuestas en localStorage
  const saveUserBets = (bets: UserBet[]) => {
    if (user) {
      localStorage.setItem(`userBets_${user.id}`, JSON.stringify(bets));
      setUserBets(bets);
    }
  };

  // Obtener todas las apuestas del usuario
  const getUserBets = (): UserBet[] => {
    return userBets;
  };

  // Obtener el número de apuestas realizadas hoy
  const getTodayBetsCount = (): number => {
    const today = new Date().toDateString();
    return userBets.filter(bet => new Date(bet.date).toDateString() === today).length;
  };

  // Validar si el usuario puede realizar una apuesta
  const canPlaceBet = (amount: number): { canBet: boolean; reason?: string } => {
    if (!user) {
      return { canBet: false, reason: 'Usuario no autenticado' };
    }

    if (user.role === 'admin') {
      return { canBet: false, reason: 'Los administradores no pueden realizar apuestas' };
    }

    if (amount <= 0) {
      return { canBet: false, reason: 'El monto debe ser mayor a 0' };
    }

    if (amount > user.balance) {
      return { canBet: false, reason: 'Saldo insuficiente' };
    }

    const todayBets = getTodayBetsCount();
    if (todayBets >= 3) {
      return { canBet: false, reason: 'Has alcanzado el límite de 3 apuestas por hoy. Intenta nuevamente mañana.' };
    }

    return { canBet: true };
  };

  // Realizar una apuesta
  const placeBet = async (betData: Omit<UserBet, 'id' | 'userId' | 'date' | 'status'>): Promise<boolean> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const validation = canPlaceBet(betData.amount);
    if (!validation.canBet) {
      throw new Error(validation.reason || 'No se puede realizar la apuesta');
    }

    try {
      // Crear la nueva apuesta
      const newBet: UserBet = {
        ...betData,
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        date: new Date().toISOString(),
        status: 'active'
      };

      // Descontar el monto del saldo
      const newBalance = user.balance - betData.amount;
      updateUserBalance(newBalance);      // Agregar la apuesta al historial
      const updatedBets = [...userBets, newBet];
      saveUserBets(updatedBets);

      // Registrar la transacción de la apuesta
      addTransaction({
        type: 'bet',
        amount: -betData.amount,
        description: `Apuesta: ${betData.matchName}`
      });

      return true;
    } catch (error) {
      console.error('Error al realizar la apuesta:', error);      return false;
    }
  };

  // ===== FUNCIONES DE MANEJO DE TRANSACCIONES =====
  
  // Guardar transacciones en localStorage
  const saveUserTransactions = (transactions: UserTransaction[]) => {
    if (user) {
      localStorage.setItem(`userTransactions_${user.id}`, JSON.stringify(transactions));
      setUserTransactions(transactions);
    }
  };

  // Obtener todas las transacciones del usuario
  const getUserTransactions = (): UserTransaction[] => {
    return userTransactions;
  };

  // Agregar una nueva transacción
  const addTransaction = (transactionData: Omit<UserTransaction, 'id' | 'userId' | 'date'>) => {
    if (!user) return;

    const newTransaction: UserTransaction = {
      ...transactionData,
      id: Date.now(),
      userId: user.id,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };

    const updatedTransactions = [...userTransactions, newTransaction];
    saveUserTransactions(updatedTransactions);
  };

  // Función para restablecer contraseña por email
  const resetPasswordByEmail = (email: string, newPassword: string): boolean => {
    const account = findAccountByEmail(email);
    if (account) {
      // Validar la nueva contraseña
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Actualizar en la lista de cuentas actuales
      setCurrentAccounts(prev => 
        prev.map(acc => 
          acc.user.email === email 
            ? { ...acc, password: newPassword }
            : acc
        )
      );
      
      // También guardar en localStorage para compatibilidad
      saveUserCredentials(account.user.id, newPassword);
      return true;
    }
    return false;
  };

  // Función para obtener información de las cuentas predefinidas (sin contraseñas)
  const getPredefinedAccounts = () => {
    return PREDEFINED_ACCOUNTS.map(account => ({
      email: account.user.email,
      username: account.user.username,
      role: account.user.role
    }));
  };  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.role === 'admin',
        canBet: !!user && user.role !== 'admin',
        isBackendAuthenticated: !!user && !sessionStorage.getItem('auth_fallback') && FEATURES.USE_BACKEND_AUTH,
        login,
        register,
        logout,
        updateUserBalance,
        updateUserProfile,
        validateCurrentPassword,
        validatePassword,
        updatePassword,        resetPasswordByEmail,
        getPredefinedAccounts,        // Funciones de apuestas
        placeBet,
        getUserBets,
        getTodayBetsCount,
        canPlaceBet,
        // Funciones de transacciones
        getUserTransactions,
        addTransaction,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};