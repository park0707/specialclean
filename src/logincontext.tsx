// src/logincontext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase가 로그인 상태 변화를 알려주는 리스너
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);   // 로그인 했다면 User, 아니면 null
      setLoading(false);
    });

    // 컴포넌트 unmount시 리스너 정리
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
