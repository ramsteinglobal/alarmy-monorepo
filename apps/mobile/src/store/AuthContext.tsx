import { createContext, useContext, useState, type ReactNode } from 'react';

type AuthState = {
  userId: string | null;
  setUserId: (id: string | null) => void;
};

const AuthContext = createContext<AuthState>({ userId: null, setUserId: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  return <AuthContext.Provider value={{ userId, setUserId }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
