import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Eğer kullanıcı giriş yapmamışsa login sayfasına yönlendir
    return <Navigate to="/login" />;
  }

  return children;
}
