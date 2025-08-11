import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

declare module '../../firebase' {
  const auth: Auth;
  const db: Firestore;
  const app: any;
  
  export { auth, db };
  export default app;
}
