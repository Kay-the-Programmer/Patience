
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants'; 

interface AuthContextType {
  currentUser: User | null;
  login: (userId: string) => boolean;
  logout: () => void;
  availableUsers: User[]; // Kept for login page user selection
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Default to no user logged in

  const availableUsers = useMemo(() => MOCK_USERS, []);

  const login = useCallback((userId: string): boolean => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    setCurrentUser(null);
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, availableUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
