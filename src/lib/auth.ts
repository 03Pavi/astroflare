import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

/** Save or update user in Appwrite collection */
async function upsertUserInAppwrite(user: User, provider: string) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      firebaseUid: user.uid,
      name: user.displayName ?? user.email ?? 'Unknown',
      email: user.email ?? '',
      provider,
      photoURL: user.photoURL ?? '',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save user profile');
  }
}

/** Sign in with Google popup (Firebase) then save user to Appwrite */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await upsertUserInAppwrite(result.user, 'google');
  return result.user;
}

/** Sign in with email + password (Firebase) then save user to Appwrite */
export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await upsertUserInAppwrite(result.user, 'email');
  return result.user;
}

/** Sign up with email + password (Firebase) then save user to Appwrite */
export async function signupWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await upsertUserInAppwrite(result.user, 'email');
  return result.user;
}

/** Get current Firebase user synchronously */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/** Subscribe to auth state changes */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/** Sign out of Firebase */
export async function logout() {
  await signOut(auth);
}

/** Handle OAuth Callback (e.g. from redirect) */
export async function handleOAuthCallback() {
  // If we are using popup this is not strictly necessary but keeping for compatibility
  // with redirect flows if implemented
  return Promise.resolve();
}
