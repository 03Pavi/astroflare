import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { databases } from '@/lib/appwrite';
import { ID } from 'appwrite';

const auth = getAuth(app);

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string;
const USERS_COLL = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string; // user_details

/** Save or update user in Appwrite collection */
async function upsertUserInAppwrite(user: User, provider: string) {
  try {
    await databases.createDocument(DB_ID, USERS_COLL, user.uid, {
      firebaseUid: user.uid,
      name: user.displayName ?? user.email ?? 'Unknown',
      email: user.email ?? '',
      provider,
      photoURL: user.photoURL ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      onboardingComplete: false,
    });
  } catch {
    // Document already exists — skip silently
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
