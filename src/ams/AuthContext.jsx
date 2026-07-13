import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from './data/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .currentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const signedIn = await api.signIn(email, password);
    setUser(signedIn);
    return signedIn;
  }, []);

  const signUp = useCallback(async (details) => {
    const result = await api.signUp(details);
    if (!result.needsApproval) setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
