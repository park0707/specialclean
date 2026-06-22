// src/logincontext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { syncUserDocument, type AppUser } from './lib/firebaseuser';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  hasUnreadNotice: boolean;
  checkUnreadNotice: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);

  const checkUnreadNotice = async () => {
    // 어드민은 알림을 받지 않음
    if (appUser?.role === 'admin') {
      setHasUnreadNotice(false);
      return;
    }

    try {
      const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      const noticeIds = snap.docs.map((doc) => doc.id);

      if (noticeIds.length === 0) {
        setHasUnreadNotice(false);
        return;
      }

      let readNoticeIds: string[] = [];
      try {
        const stored = localStorage.getItem('read_notice_ids');
        if (stored) {
          readNoticeIds = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse read_notice_ids from localStorage', e);
      }

      const hasUnread = noticeIds.some((id) => !readNoticeIds.includes(id));
      setHasUnreadNotice(hasUnread);
    } catch (error) {
      console.error('Error checking unread notices:', error);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        const synced = await syncUserDocument(firebaseUser);
        setAppUser(synced);
      } catch (error) {
        console.error('Failed to sync user document:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    checkUnreadNotice();
  }, [appUser]);

  const value: AuthContextType = {
    user,
    appUser,
    loading,
    isAdmin: appUser?.role === 'admin',
    isManager: appUser?.role === 'manager',
    hasUnreadNotice,
    checkUnreadNotice,
  };

  return (
    <AuthContext.Provider value={value}>
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
