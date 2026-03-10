// src/lib/firestoreUser.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
}

export const syncUserDocument = async (firebaseUser: FirebaseUser): Promise<AppUser> => {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'user',
      };

      await setDoc(userRef, newUser);
      return newUser;
    }

    const data = snap.data() as AppUser;
    return data;
  } catch (error) {
    console.error('syncUserDocument error:', error);
    throw error;
  }
};
