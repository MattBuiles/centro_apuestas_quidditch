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

// Interfaz para almacenar credenciales de usuario (separada por seguridad)
interface UserCredentials {
  userId: string;
  password: string;
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
  validateCurrentPassword: (password: string) => boolean;
  updatePassword: (newPassword: string) => void;
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

  // Funciones auxiliares para manejar credenciales de manera segura
  const saveUserCredentials = (userId: string, password: string) => {
    const credentials: UserCredentials = { userId, password };
    localStorage.setItem(`credentials_${userId}`, JSON.stringify(credentials));
  };

  const getUserCredentials = (userId: string): UserCredentials | null => {
    const credentials = localStorage.getItem(`credentials_${userId}`);
    return credentials ? JSON.parse(credentials) : null;
  };

  const clearUserCredentials = (userId: string) => {
    localStorage.removeItem(`credentials_${userId}`);
  };

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);  const login = async (email: string, password: string, remember = false) => {
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
        
        // Guardar credenciales del admin
        saveUserCredentials(adminUser.id, password);

        if (remember) {
          localStorage.setItem('user', JSON.stringify(adminUser));
        } else {
          sessionStorage.setItem('user', JSON.stringify(adminUser));
        }

        navigate('/account');
        return;
      }      // Regular user login - verificar si existe en localStorage
      const mockUser: User = {
        id: '1',
        username: 'MagoApostador123',
        email,
        balance: 150,
        role: 'user',
        avatar: '/src/assets/User_Logo.png',
      };

      setUser(mockUser);
      
      // Guardar credenciales del usuario
      saveUserCredentials(mockUser.id, password);

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
  };  const register = async (username: string, email: string, password: string, _birthdate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call
      // For this wireframe, we'll just simulate a successful registration
      const mockUser: User = {
        id: Date.now().toString(), // ID único basado en timestamp
        username,
        email,
        balance: 150, // Starting balance for new users
        role: 'user',
        avatar: '/src/assets/User_Logo.png',
      };

      setUser(mockUser);
      
      // Guardar credenciales del usuario registrado
      saveUserCredentials(mockUser.id, password);
      
      sessionStorage.setItem('user', JSON.stringify(mockUser));
      navigate('/');
    } catch (err) {
      setError('Error al registrarse. Por favor, inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };  const logout = () => {
    if (user) {
      clearUserCredentials(user.id);
    }
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
  };

  // Función para validar la contraseña actual
  const validateCurrentPassword = (password: string): boolean => {
    if (!user) return false;
    
    const credentials = getUserCredentials(user.id);
    return credentials ? credentials.password === password : false;
  };

  // Función para actualizar la contraseña
  const updatePassword = (newPassword: string) => {
    if (user) {
      saveUserCredentials(user.id, newPassword);
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
        validateCurrentPassword,
        updatePassword,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};