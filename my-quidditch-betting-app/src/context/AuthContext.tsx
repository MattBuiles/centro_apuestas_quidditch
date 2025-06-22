import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: 'user' | 'admin';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  canBet: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string, birthdate: string) => Promise<void>;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
  updateUserProfile: (userData: Partial<Pick<User, 'username' | 'email' | 'avatar'>>) => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);
  const login = async (email: string, password: string, remember = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // Check for admin credentials
      if (email === 'admin@example.com' && password === 'admin123') {        const adminUser: User = {
          id: 'admin',
          username: 'Administrador',
          email,
          balance: 0,
          role: 'admin',
          avatar: '/src/assets/User_Logo.png',
        };

        setUser(adminUser);

        if (remember) {
          localStorage.setItem('user', JSON.stringify(adminUser));
        } else {
          sessionStorage.setItem('user', JSON.stringify(adminUser));
        }

        navigate('/account');
        return;
      }      // Regular user login
      const mockUser: User = {
        id: '1',
        username: 'MagoApostador123',
        email,
        balance: 150,
        role: 'user',
        avatar: '/src/assets/User_Logo.png',
      };

      setUser(mockUser);

      // Store user in localStorage if remember is checked
      if (remember) {
        localStorage.setItem('user', JSON.stringify(mockUser));
      } else {
        sessionStorage.setItem('user', JSON.stringify(mockUser));
      }

      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };  const register = async (username: string, email: string, password: string, birthdate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call
      // For this wireframe, we'll just simulate a successful registration
      const mockUser: User = {
        id: '1',
        username,
        email,
        balance: 150, // Starting balance for new users
        role: 'user',
        avatar: '/src/assets/User_Logo.png',
      };

      setUser(mockUser);
      sessionStorage.setItem('user', JSON.stringify(mockUser));
      navigate('/');
    } catch (err) {
      setError('Error al registrarse. Por favor, inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
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
  };

  const updateUserProfile = (userData: Partial<Pick<User, 'username' | 'email' | 'avatar'>>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
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
  };  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.role === 'admin',
        canBet: !!user && user.role !== 'admin',
        login,
        register,
        logout,
        updateUserBalance,
        updateUserProfile,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};