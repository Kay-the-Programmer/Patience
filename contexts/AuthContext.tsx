
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { User, UserRole } from '../types'; // UserRole might be needed for addUser
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  currentUser: User | null;
  login: (userId: string) => boolean;
  logout: () => void;
  availableUsers: User[];
  users: User[]; // To list users on the management page
  addUser: (userData: Omit<User, 'id'>) => User; // Returns the new user with ID
  updateUser: (userId: string, updatedUserData: Partial<Omit<User, 'id'>>) => boolean;
  deleteUser: (userId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS); // Initialize with MOCK_USERS

  const availableUsers = useMemo(() => users, [users]); // Use users state

  const login = useCallback((userId: string): boolean => {
    const user = users.find(u => u.id === userId); // Use users state
    if (user) {
      setCurrentUser(user);
      return true;
    }
    setCurrentUser(null);
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const addUser = useCallback((userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    return newUser;
  }, []);

  const updateUser = useCallback((userId: string, updatedUserData: Partial<Omit<User, 'id'>>): boolean => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, ...updatedUserData } : user
      )
    );
    // Optionally, update currentUser if the logged-in user is being updated
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedUserData } : null);
    }
    return true; // Assuming success, can add error handling if needed
  }, [currentUser]);

  const deleteUser = useCallback((userId: string): boolean => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null); // Log out if the current user is deleted
    }
    return true; // Assuming success
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, availableUsers, users, addUser, updateUser, deleteUser }}>
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
