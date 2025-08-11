import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

declare module '../../firebase' {
  export const auth: Auth;
  export const db: Firestore;
  const app: any; // veya daha spesifik bir tip kullanabilirsiniz
  export default app;
}
