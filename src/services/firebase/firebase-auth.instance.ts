import { getAuth } from 'firebase/auth';
import { app } from './firebase.instance';

export const auth = getAuth(app);
