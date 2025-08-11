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
import { auth } from '../../firebase';
import { User } from '../types';

// Define the shape of our context
interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  loading: boolean;
}

// Create and export the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
// Define props type for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Update user profile with display name and photo URL
  const updateUserProfile = async (user: FirebaseUser, displayName?: string, photoURL?: string) => {
    if (displayName || photoURL) {
      await updateProfile(user, {
        displayName: displayName || user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email?.split('@')[0] || 'User')}&background=random`
      });
    }
    
    // Create a new user object with the updated profile
    const updatedUser: User = {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'User',
      avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email?.split('@')[0] || 'User')}&background=random`,
      createdAt: user.metadata.creationTime || new Date().toISOString()
    };
    
    // Update the current user state
    setCurrentUser(updatedUser);
    
    return updatedUser;
  };

  // Track user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User')}&background=random`,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
        };
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register with email/password
  const signup = async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateUserProfile(userCredential.user, displayName);
    }
    return userCredential;
  };

  // Login with email/password
  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log('Google ile giriş başlatılıyor...');
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      console.log('Google Auth Provider oluşturuldu, popup açılıyor...');
      const result = await signInWithPopup(auth, provider);
      console.log('Google ile giriş başarılı:', result.user?.email);
      
      return result;
    } catch (error: any) {
      console.error('Google ile giriş hatası:', error);
      
      let errorMessage = 'Google ile giriş yapılırken bir hata oluştu.';
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Bu e-posta adresiyle zaten bir hesap oluşturulmuş. Lütfen farklı bir yöntemle giriş yapın.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google giriş penceresi kapatıldı.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Tarayıcınız Google giriş penceresini engelledi. Lütfen pop-up engelleyicinizi kontrol edin.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Giriş işlemi iptal edildi.';
      } else if (error.code) {
        errorMessage = `Hata kodu: ${error.code}`;
      }
      
      console.error('Google giriş hatası detayları:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential
      });
      
      throw new Error(errorMessage);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
      throw error;
    }
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