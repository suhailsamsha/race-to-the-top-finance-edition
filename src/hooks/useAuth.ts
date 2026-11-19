import { useCallback, useEffect, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import { PortalRole } from '../types/competition';

const PORTAL_STORAGE_KEY = 'race_portal_role';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);
  const [portalRole, setPortalRole] = useState<PortalRole | null>(() => {
    try {
      const saved = sessionStorage.getItem(PORTAL_STORAGE_KEY);
      if (saved === 'user' || saved === 'admin') return saved;
    } catch {
      // Ignore storage errors
    }
    return null;
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminAccessDenied, setAdminAccessDenied] = useState<boolean>(false);
  const [signingInRole, setSigningInRole] = useState<PortalRole | null>(null);

  const requestedRoleRef = useRef<PortalRole | null>(portalRole);

  const persistPortalChoice = useCallback((role: PortalRole | null) => {
    setPortalRole(role);
    requestedRoleRef.current = role;
    try {
      if (role) {
        sessionStorage.setItem(PORTAL_STORAGE_KEY, role);
      } else {
        sessionStorage.removeItem(PORTAL_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const checkAdminAuthorization = useCallback(async (firebaseUser: User): Promise<boolean> => {
    if (
      firebaseUser.email &&
      firebaseUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
      firebaseUser.emailVerified
    ) {
      return true;
    }
    try {
      const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
      return adminSnap.exists();
    } catch {
      return false;
    }
  }, []);

  const syncUserProfile = useCallback(async (firebaseUser: User, isAdmin: boolean) => {
    const publicPath = `users/${firebaseUser.uid}`;
    const privatePath = `users/${firebaseUser.uid}/private/info`;
    const displayName = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Participant').slice(0, 80);

    try {
      const publicRef = doc(db, 'users', firebaseUser.uid);
      const existingSnap = await getDoc(publicRef);
      if (!existingSnap.exists()) {
        await setDoc(publicRef, {
          uid: firebaseUser.uid,
          displayName,
          role: isAdmin ? 'admin' : 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(publicRef, {
          displayName,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, publicPath);
    }

    if (firebaseUser.email) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'private', 'info'), {
          email: firebaseUser.email.slice(0, 160),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, privatePath);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdminAuthorized(false);
        setAdminAccessDenied(false);
        setAuthLoading(false);
        return;
      }

      setUser(firebaseUser);
      const adminOk = await checkAdminAuthorization(firebaseUser);
      setIsAdminAuthorized(adminOk);

      try {
        await syncUserProfile(firebaseUser, adminOk);
      } catch {
        // Sync errors handled via handleFirestoreError
      }

      const desired = requestedRoleRef.current;
      if (desired === 'admin') {
        if (adminOk) {
          setAdminAccessDenied(false);
          persistPortalChoice('admin');
        } else {
          setAdminAccessDenied(true);
          persistPortalChoice(null);
        }
      } else if (desired === 'user') {
        setAdminAccessDenied(false);
        persistPortalChoice('user');
      } else {
        // Default on reload if signed in without explicit portal choice: route admin to admin, user to user
        setAdminAccessDenied(false);
        persistPortalChoice(adminOk ? 'admin' : 'user');
      }

      setAuthLoading(false);
      setSigningInRole(null);
    });

    return () => unsubscribe();
  }, [checkAdminAuthorization, persistPortalChoice, syncUserProfile]);

  const signInWithPortal = useCallback(
    async (role: PortalRole) => {
      setAuthError(null);
      setAdminAccessDenied(false);
      requestedRoleRef.current = role;
      setSigningInRole(role);

      // If already signed in with Firebase Auth, switch or verify directly
      if (auth.currentUser) {
        const adminOk = await checkAdminAuthorization(auth.currentUser);
        setIsAdminAuthorized(adminOk);
        if (role === 'admin' && !adminOk) {
          setAdminAccessDenied(true);
          setSigningInRole(null);
          return;
        }
        persistPortalChoice(role);
        setSigningInRole(null);
        return;
      }

      try {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sign-in failed.';
        if (!msg.includes('popup-closed-by-user')) {
          setAuthError(msg);
        }
        setSigningInRole(null);
      }
    },
    [checkAdminAuthorization, persistPortalChoice]
  );

  const switchPortalRole = useCallback(
    (target: PortalRole) => {
      if (target === 'admin' && !isAdminAuthorized) {
        setAdminAccessDenied(true);
        return;
      }
      setAdminAccessDenied(false);
      persistPortalChoice(target);
    },
    [isAdminAuthorized, persistPortalChoice]
  );

  const grantAdminByUid = useCallback(
    async (targetUid: string): Promise<boolean> => {
      const cleaned = targetUid.trim();
      if (!cleaned || !isAdminAuthorized) return false;
      try {
        await setDoc(doc(db, 'admins', cleaned), {
          uid: cleaned,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `admins/${cleaned}`);
      }
    },
    [isAdminAuthorized]
  );

  const signOut = useCallback(async () => {
    setAuthError(null);
    setAdminAccessDenied(false);
    persistPortalChoice(null);
    await firebaseSignOut(auth);
  }, [persistPortalChoice]);

  return {
    user,
    authLoading,
    isAdminAuthorized,
    portalRole,
    authError,
    adminAccessDenied,
    signingInRole,
    signInWithPortal,
    switchPortalRole,
    grantAdminByUid,
    signOut,
  };
}
