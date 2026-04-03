import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext(null);

// Admin access is tied to email, not UID (UIDs can change across Firebase projects)
const ADMIN_EMAILS = ['nabstertsr@gmail.com'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        setIsEmailVerified(currentUser.emailVerified);
        setIsAdmin(ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()));

        // Try to load cached profile immediately for instant UI
        const cached = localStorage.getItem('user_profile');
        if (cached) {
          try { setUserProfile(JSON.parse(cached)); } catch { }
        }

        // Only sync with Firestore when online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          try {
            const { doc, getDoc, setDoc } = await import('firebase/firestore');
            const { db: firestoreDB } = await import('@/lib/firebase');
            const profileRef = doc(firestoreDB, 'users', currentUser.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              const profileData = profileSnap.data();
              setUserProfile(profileData);
              localStorage.setItem('user_profile', JSON.stringify(profileData));
            } else {
              const defaultProfile = {
                uid: currentUser.uid,
                email: currentUser.email,
                full_name: currentUser.displayName || 'New Scholar',
                role: 'Learner',
                created_at: new Date().toISOString(),
                is_admin: ADMIN_EMAILS.includes(currentUser.email?.toLowerCase())
              };
              await setDoc(profileRef, defaultProfile);
              setUserProfile(defaultProfile);
              localStorage.setItem('user_profile', JSON.stringify(defaultProfile));
            }

            // Update Global Registry for Admin Tracking
            const registryRef = doc(firestoreDB, 'admin', 'registry', 'users', currentUser.uid);
            const userRole = (profileSnap?.exists() ? profileSnap.data().role : null) || 'Learner';
            await setDoc(registryRef, {
              uid: currentUser.uid,
              email: currentUser.email || null,
              last_seen: new Date().toISOString(),
              role: userRole
            }, { merge: true });

          } catch (e) {
            if (e.code !== 'unavailable' && !e.message?.includes('offline')) {
              console.error("Profile sync error:", e);
            }
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsEmailVerified(false);
        setIsAdmin(false);
        setUserProfile(null);
      }
      setIsLoadingAuth(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setAuthError(error);
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const sendVerification = async () => {
    if (user && !user.emailVerified) {
      try {
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(user, {
          url: window.location.origin + (import.meta.env.BASE_URL || '/'),
          handleCodeInApp: false
        });
        return { success: true };
      } catch (e) {
        if (e.code === 'auth/too-many-requests') {
          return { success: false, message: 'Too many attempts. Please wait a few minutes.' };
        }
        if (e.code === 'auth/unauthorized-continue-uri' || e.message?.includes('400')) {
          return { success: false, message: 'Domain not authorized. Add your domain in Firebase Console → Auth → Settings.' };
        }
        console.error('Verification email error:', e);
        return { success: false, message: e.message || 'Verification failed. Try again later.' };
      }
    }
    return { success: false, message: 'No user or already verified.' };
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db: firestoreDB } = await import('@/lib/firebase');
      const profileRef = doc(firestoreDB, 'users', user.uid);
      await updateDoc(profileRef, updates);
      const newProfile = { ...userProfile, ...updates };
      setUserProfile(newProfile);
      localStorage.setItem('user_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error('Profile update error:', e);
    }
  };

  const navigateToLogin = () => {
    const base = import.meta.env.BASE_URL || '/';
    window.location.href = `${base}Login`.replace('//', '/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      isEmailVerified,
      isAdmin,
      userProfile,
      logout,
      navigateToLogin,
      sendVerification,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
