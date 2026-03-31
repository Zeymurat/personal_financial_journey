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
  UserCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
// Firestore için gerekli metodlar: doc, setDoc, getDoc
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Firestore instance'ı (db) buradan gelmeli
import { authAPI } from '../services/apiService';



// User tipi (types.ts olmadığı için buraya eklendi)
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: string;
}

// AuthContext tipi
interface AuthContextType {
  currentUser: User | null | undefined;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, name: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasPasswordProvider: boolean;
  loading: boolean;
  authenticating: boolean; // Tracks if backend authentication is in progress
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  const processUserAuthentication = async (user: FirebaseUser) => {
    // Not: authenticating state'i çağıran yerlerde yönetiliyor
    // (onAuthStateChanged ve login fonksiyonlarında)
    try {
      const idToken = await user.getIdToken();
      const backendResponse = await authAPI.firebaseLogin(idToken);
      
      return backendResponse;

    } catch (error) {
      // Hata durumunda, kullanıcının API istekleri yapmasını engellemek için
      // localStorage'daki token'ları temizlemek iyi bir pratik olabilir.
      authAPI.logout();
      throw error;
    }
  };

  // Firestore'da kullanıcı dokümanının varlığını kontrol eder ve yoksa oluşturur
  const ensureFirestoreUserDocument = async (firebaseUser: FirebaseUser, initialName?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // Eğer Firestore'da kullanıcı dokümanı yoksa, oluştur
      const displayName = initialName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
      const avatarUrl = firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

      await setDoc(userDocRef, {
        id: firebaseUser.uid,
        name: displayName,
        email: firebaseUser.email || '',
        avatar: avatarUrl,
        createdAt: new Date().toISOString(),
      });
    }
  };

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
        setHasPasswordProvider(
          firebaseUser.providerData.some((p) => p.providerId === EmailAuthProvider.PROVIDER_ID)
        );
        await updateUserProfileAndState(firebaseUser);
        // Oturum açan her kullanıcı için Firestore dokümanını kontrol et
        try {
          await ensureFirestoreUserDocument(firebaseUser);
        } catch (error) {
          // Firestore permission hatası olsa bile login'i engelleme
        }
        
        // Sayfa yenilendiğinde veya oturum devam ederken backend'e authenticate et
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            setAuthenticating(true);
            try {
              await processUserAuthentication(firebaseUser);
              console.log('✅ Giriş başarılı');
            } finally {
              setAuthenticating(false);
            }
          }
        } catch (error) {
          setAuthenticating(false);
        }
      } else {
        setCurrentUser(null);
        setHasPasswordProvider(false);
        setAuthenticating(false);
        // Logout durumunda token'ları temizle
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
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
      // Kayıt işleminden sonra Firestore'a kaydı garanti et
      await ensureFirestoreUserDocument(user, name);
    }
    return userCredential;
  };

  // E-posta ve şifre ile giriş
  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Giriş işleminden sonra Firestore'a kaydı garanti et
    // Not: processUserAuthentication onAuthStateChanged içinde çağrılıyor
    // Burada sadece Firestore dokümanını kontrol ediyoruz
    if (userCredential.user) {
      await ensureFirestoreUserDocument(userCredential.user);
    }
    return userCredential;
  };

  // Google ile giriş
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Google ile girişten sonra Firestore'a kaydı garanti et
      // Not: processUserAuthentication onAuthStateChanged içinde çağrılıyor
      // Burada sadece Firestore dokümanını kontrol ediyoruz
      if (result.user) {
        await ensureFirestoreUserDocument(result.user);
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

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) {
      throw new Error('auth/no-email');
    }
    if (
      !firebaseUser.providerData.some((p) => p.providerId === EmailAuthProvider.PROVIDER_ID)
    ) {
      throw new Error('auth/no-password-provider');
    }
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  };

  const value = useMemo(() => ({
    currentUser,
    login,
    signup,
    logout,
    signInWithGoogle,
    changePassword,
    hasPasswordProvider,
    loading,
    authenticating
  }), [currentUser, hasPasswordProvider, loading, authenticating]);

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
  // Explicitly return as AuthContextType to ensure type safety
  return context as AuthContextType;
}