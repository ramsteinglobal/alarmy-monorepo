import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from '@react-native-firebase/auth';
import { firebaseAuth } from '../config/firebaseSetup';
import { saveAlarms } from '../storage/alarmStorage';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, authUser => {
      setUser(prev => {
        // Fresh sign-in: merge cloud records down, push local records up.
        if (!prev && authUser) {
          import('../services/cloudSync')
            .then(({ initialCloudSync }) => initialCloudSync(saveAlarms))
            .catch(error => console.error('Cloud sync failed:', error));
        }
        return authUser;
      });
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
