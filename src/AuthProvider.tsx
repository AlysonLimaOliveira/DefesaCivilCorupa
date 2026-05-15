import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, onSnapshot, type User, type DocumentSnapshot } from './firebase';
import { type UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isAgent: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Monitoramento em tempo real do perfil no Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);

        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Se o perfil existe mas não tem foto e o Auth tem, atualiza o Firestore
            if (!data.photoURL && currentUser.photoURL) {
              updateDoc(userDocRef, { photoURL: currentUser.photoURL });
            }
            setProfile(data);
          } else {
            // Se o perfil não existe, cria o inicial
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              role: currentUser.email === 'alyson_apps@hotmail.com' ? 'admin' : 'operator',
            };
            setDoc(userDocRef, newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Erro no listener de perfil:", error);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'alyson_apps@hotmail.com';
  const isAgent = profile?.role === 'agent' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isAgent }}>
      {children}
    </AuthContext.Provider>
  );
};
