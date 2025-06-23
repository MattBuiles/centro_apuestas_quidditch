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

// Interfaz para cuentas completas con credenciales
interface UserAccount {
  user: User;
  password: string;
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
  validatePassword: (password: string) => string | null;
  updatePassword: (newPassword: string) => void;
  // Nueva función para restablecer contraseña por email
  resetPasswordByEmail: (email: string, newPassword: string) => boolean;
  // Nueva función para obtener las cuentas predefinidas (útil para debugging)
  getPredefinedAccounts: () => { email: string; username: string; role: string }[];
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
  const [currentAccounts, setCurrentAccounts] = useState<UserAccount[]>(PREDEFINED_ACCOUNTS);
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
      // Buscar la cuenta por email en las cuentas actuales
      const account = findAccountByEmail(email);
      
      if (!account) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      }

      // Verificar la contraseña
      if (account.password !== password) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      }

      // Login exitoso
      setUser(account.user);
      
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };  const register = async (username: string, email: string, password: string, _birthdate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validar la contraseña
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse. Por favor, inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };const logout = () => {
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
  };  // Función para restablecer contraseña por email
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
        login,
        register,
        logout,
        updateUserBalance,
        updateUserProfile,
        validateCurrentPassword,
        validatePassword,
        updatePassword,
        resetPasswordByEmail,
        getPredefinedAccounts,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};