import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getAuth,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const firebaseAuth = getAuth();
const firestore = getFirestore();

GoogleSignin.configure({
  webClientId: '287845974246-490t3qus833b832fqhrq4gfep08agieh.apps.googleusercontent.com',
});

export type SleepPersona = 'early' | 'deep' | 'napper';

export const signUp = async (
  fullName: string,
  email: string,
  password: string,
  sleepPersona: SleepPersona,
) => {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const user = credential.user;

  try {
    await updateProfile(user, { displayName: fullName });
    await setDoc(doc(firestore, 'users', user.uid), {
      uid: user.uid,
      fullName,
      email: user.email ?? email,
      sleepPersona,
      provider: 'password',
      createdAt: serverTimestamp(),
    });
    return user;
  } catch (error) {
    // Avoid leaving an Auth account behind if profile creation fails.
    await user.delete();
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return credential.user;
};

export const signInWithGoogle = async (sleepPersona?: SleepPersona) => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success' || !response.data.idToken) {
    return null;
  }

  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const { user } = await signInWithCredential(firebaseAuth, credential);
  const profileRef = doc(firestore, 'users', user.uid);
  const existingProfile = await getDoc(profileRef);
  await setDoc(
    profileRef,
    {
      uid: user.uid,
      fullName: user.displayName ?? response.data.user.name ?? '',
      email: user.email ?? response.data.user.email,
      photoURL: user.photoURL ?? response.data.user.photo,
      provider: 'google',
      ...(sleepPersona ? { sleepPersona } : {}),
      ...(existingProfile.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
  return user;
};

export const logOut = async () => signOut(firebaseAuth);

export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(firebaseAuth, email);
};

export const getAuthErrorMessage = (error: unknown) => {
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled in Firebase Console.';
    case 'auth/network-request-failed':
      return 'Could not connect. Check your internet connection and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account with this email already exists. Sign in using its original method.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a little while, then try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support for help.';
    case 'auth/requires-recent-login':
      return 'For your security, sign in again before trying this action.';
    case 'auth/credential-already-in-use':
      return 'This sign-in method is already linked to another account.';
    case 'auth/unauthorized-domain':
      return 'This app is not authorized for sign-in. Contact support.';
    default:
      if (/DEVELOPER_ERROR|developer error|\b12500\b|\b10\b/i.test(`${code ?? ''} ${message}`)) {
        return 'Google sign-in setup is incomplete for this app build. Check that this build’s Android package name and signing SHA-1 are registered in Firebase, and that Google sign-in is enabled.';
      }
      if (/SIGN_IN_CANCELLED|12501|CANCELED/i.test(`${code ?? ''} ${message}`)) {
        return 'Google sign-in was cancelled.';
      }
      if (/network|timeout|unavailable/i.test(`${code ?? ''} ${message}`)) {
        return 'Could not connect. Check your internet connection and try again.';
      }
      return 'Something went wrong. Please try again.';
  }
};
