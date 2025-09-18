// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Firestore instance'ı (db) buradan gelmeli
import { User } from '../types';


// AuthContext tipi
interface AuthContextType {
  currentUser: User | null | undefined; // currentUser'ın üç farklı durumu olabilir
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, name: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Firebase Auth profilini ve yerel state'i aynı anda güncellemek için yardımcı fonksiyon
  const updateUserProfileAndState = async (firebaseUser: FirebaseUser, displayName?: string, photoURL?: string) => {
    const finalDisplayName = displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
    const finalPhotoURL = photoURL || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDisplayName)}&background=random`;

    if (firebaseUser.displayName !== finalDisplayName || firebaseUser.photoURL !== finalPhotoURL) {
      await updateProfile(firebaseUser, {
        displayName: finalDisplayName,
        photoURL: finalPhotoURL
      });
    }
    
    const updatedUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: finalDisplayName,
      avatar: finalPhotoURL,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
    };
    
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  // Kullanıcı oturum durumunu takip et
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await updateUserProfileAndState(firebaseUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // E-posta ve şifre ile kayıt
  const signup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      await updateUserProfileAndState(user, name); 
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
      });
    }
    return userCredential;
  };

  // E-posta ve şifre ile giriş
  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google ile giriş
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Hata veren satır yerine bu kod bloğunu kullanın
      // 'result' objesini 'additionalUserInfo' özelliğine sahip olduğunu varsayarak kullanıyoruz
      const { user, additionalUserInfo } = result as {
        user: FirebaseUser,
        additionalUserInfo?: { isNewUser: boolean }
      };

      if (user && additionalUserInfo?.isNewUser) { 
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          createdAt: new Date().toISOString(),
        });
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
};


  // Çıkış yap
  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const value = useMemo(() => ({
    currentUser,
    login,
    signup,
    logout,
    signInWithGoogle,
    loading
  }), [currentUser, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}