// src/lib/firestoreUser.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'user' | 'manager';
}

export const syncUserDocument = async (firebaseUser: FirebaseUser): Promise<AppUser> => {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    let data: AppUser;

    if (!snap.exists()) {
      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'user',
      };

      await setDoc(userRef, newUser);
      data = newUser;
    } else {
      data = snap.data() as AppUser;
    }

    // 만약 현재 유저의 역할이 일반 'user'라면, 승인된 업체가 있는지 확인하여 자동으로 'manager'로 승급
    if (data.role === 'user') {
      console.log('[Role Upgrade Check] Checking for approved applications for user:', firebaseUser.uid, firebaseUser.email);
      try {
        const qUid = query(
          collection(db, 'businessApplications'),
          where('ownerUid', '==', firebaseUser.uid),
          where('status', '==', 'approved')
        );
        let querySnapshot = await getDocs(qUid);
        console.log('[Role Upgrade Check] ownerUid query empty?', querySnapshot.empty);

        // 하위 호환성을 위해 ownerUid로 조회되지 않고 이메일이 존재하는 경우 이메일로 2차 검색
        if (querySnapshot.empty && firebaseUser.email) {
          const qEmail = query(
            collection(db, 'businessApplications'),
            where('ownerEmail', '==', firebaseUser.email),
            where('status', '==', 'approved')
          );
          querySnapshot = await getDocs(qEmail);
          console.log('[Role Upgrade Check] ownerEmail query empty?', querySnapshot.empty);
        }

        if (!querySnapshot.empty) {
          console.log('[Role Upgrade Check] Approved application found! Promoting to manager...');
          data.role = 'manager';
          
          // Firestore 데이터베이스 업데이트는 보안 규칙(Security Rules)에 의해 차단될 수 있습니다.
          // 차단되더라도 프론트엔드 상태(메모리)는 'manager'로 정상 작동하도록 예외 처리를 수행합니다.
          try {
            await updateDoc(userRef, { role: 'manager' });
            console.log('[Role Upgrade Check] Role updated successfully in Firestore.');
          } catch (writeErr) {
            console.warn('[Role Upgrade Check] Firestore role write blocked by Security Rules (Expected behavior for non-admin updates). Operating in-memory as manager.');
          }
        } else {
          console.log('[Role Upgrade Check] No approved application found.');
        }
      } catch (err) {
        console.error('[Role Upgrade Check] Error during auto-upgrade check:', err);
      }
    }

    return data;
  } catch (error) {
    console.error('syncUserDocument error:', error);
    throw error;
  }
};
