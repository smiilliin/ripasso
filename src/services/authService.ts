import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "@/firebase/firebase";

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);

  return result.user;
}

export function logout(): Promise<void> {
  return signOut(auth);
}

export function subscribeToAuthState(
  onChange: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, onChange);
}

