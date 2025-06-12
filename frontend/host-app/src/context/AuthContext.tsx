import { createContext, useContext, useState, type ReactNode } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  token: null as string | null,
  login: (email: string, password: string) => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const login = (email: string, password: string) => {
    // Dummy login logic; replace with actual API call
    setIsAuthenticated(true);
    setToken('dummy-token');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
