/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthProvider';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IncidentForm from './components/IncidentForm';
import IncidentList from './components/IncidentList';
import MapView from './components/MapView';
import Login from './components/Login';
import NotificationManager from './components/NotificationManager';
import OfflineSyncIndicator from './components/OfflineSyncIndicator';
import UserManagement from './components/UserManagement';
import ProfileModal from './components/ProfileModal';
import NotificationModal from './components/NotificationModal';
import { auth, db, collection, query, orderBy, onSnapshot, handleFirestoreError, OperationType, where, doc, setDoc } from './firebase';
import { signInAnonymously } from 'firebase/auth';
import { type Incident } from './types';
import { syncOfflineIncidents } from './services/offlineService';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertCircle, Info, X, Menu, Phone, MessageCircle, Mail, Lock, LogIn, UserPlus, Bell, LogOut } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile } from 'firebase/auth';
import { LOGO_URL } from './constants';

const MainApp: React.FC = () => {
  const { user, loading, isAdmin, isAgent, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialFilter, setInitialFilter] = useState('Todos');
  const [mapFocus, setMapFocus] = useState<Incident | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Auth states (Moved outside if(loading) to avoid hook order issues)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to sync offline incidents on app start
    if (navigator.onLine) {
      syncOfflineIncidents();
    }
  }, []);

  useEffect(() => {
    if (!loading && user && !isAgent) {
      setActiveTab('register');
    }
  }, [loading, user, isAgent]);

  useEffect(() => {
    if (!user || loading) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });

    return () => unsubscribe();
  }, [user, loading]);

  const handleNavigate = (tab: string, filter?: string) => {
    setActiveTab(tab);
    if (filter) {
      setInitialFilter(filter);
    } else if (tab !== 'incidents') {
      setInitialFilter('Todos');
    }
    
    if (tab !== 'incidents') setSearchQuery('');
    if (tab !== 'map') setMapFocus(null);
  };

  useEffect(() => {
    if (!user || loading) return;

    let q;
    if (isAgent) {
      q = query(collection(db, 'incidents'));
    } else {
      // Remove orderBy to avoid composite index requirement
      q = query(
        collection(db, 'incidents'), 
        where('reporterUid', '==', user.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Incident[];

      // Always sort client-side to be consistent and avoid query issues
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 0;
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 0;
        return timeB - timeA;
      });

      setIncidents(data);
    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
      handleFirestoreError(err, OperationType.LIST, 'incidents');
      setError("Erro ao carregar dados em tempo real.");
    });

    return () => unsubscribe();
  }, [user, loading, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src={LOGO_URL} 
              alt="Logo Defesa Civil Corupá" 
              className="w-14 h-14 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary tracking-tight">Carregando Sistema...</h2>
          <p className="text-gray-400 text-sm mt-1">Sincronizando dados da Defesa Civil</p>
        </div>
      </div>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    if (isRegistering) {
      if (!displayName.trim() || !cpf.trim() || !phone.trim()) {
        setAuthError('Preencha todos os campos.');
        setAuthLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('As senhas não coincidem.');
        setAuthLoading(false);
        return;
      }
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName.trim(),
          cpf: cpf.trim(),
          phone: phone.trim(),
          role: 'operator'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está em uso.');
      } else {
        setAuthError('Erro na autenticação. Verifique os dados.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setAuthError('Erro ao acessar como visitante.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-6 border border-gray-50 flex flex-col gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-2xl shadow-md mb-2">
              <img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tight">Defesa Civil</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px]">Corupá - Santa Catarina</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative text-left">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-primary/30 text-sm font-medium"
                required
              />
            </div>
            <div className="relative text-left">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-primary/30 text-sm font-medium"
                required
              />
            </div>

            {isRegistering && (
              <>
                <div className="relative text-left">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-primary/30 text-sm font-medium"
                    required
                  />
                </div>
                <div className="relative text-left">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-primary/30 text-sm font-medium"
                    required
                  />
                </div>
                <div className="relative text-left">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="CPF"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-primary/30 text-sm font-medium"
                    required
                  />
                </div>
                <div className="relative text-left">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-primary/30 text-sm font-medium"
                    required
                  />
                </div>
              </>
            )}

            {authError && <p className="text-[10px] text-danger font-bold">{authError}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[9px] font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
            >
              {isRegistering ? 'Já tenho uma conta' : 'Ainda não tenho conta'}
            </button>
          </form>

          <div className="h-px bg-gray-50 w-full" />

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <a href="tel:199" className="bg-blue-50/50 p-3 rounded-2xl flex flex-col items-center gap-1 border border-blue-100 hover:bg-blue-100 transition-colors">
                <span className="text-lg font-black text-blue-700">199</span>
                <span className="text-[7px] font-bold text-blue-400 uppercase tracking-widest">Defesa Civil</span>
              </a>
              <a href="tel:193" className="bg-red-50/50 p-3 rounded-2xl flex flex-col items-center gap-1 border border-red-100 hover:bg-red-100 transition-colors">
                <span className="text-lg font-black text-red-700">193</span>
                <span className="text-[7px] font-bold text-red-400 uppercase tracking-widest">Bombeiros</span>
              </a>
            </div>
            <a
              href="https://wa.me/554792574816"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-50/50 p-3 rounded-2xl flex items-center justify-center gap-2 border border-green-100 hover:bg-green-100 transition-colors w-full"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">WhatsApp Oficial</span>
            </a>
          </div>

          <div className="pt-2">
            <p className="text-[7px] text-gray-300 font-bold uppercase tracking-[0.3em]">Versão 3.0.0 • 2026</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Role-based protection
    const allowedTabs = [];

    if (isAdmin) {
      allowedTabs.push('dashboard', 'users', 'map', 'register', 'incidents');
    } else if (isAgent) {
      allowedTabs.push('dashboard', 'map', 'register', 'incidents');
    } else {
      allowedTabs.push('map', 'register', 'incidents');
    }
    
    if (!allowedTabs.includes(activeTab)) {
      return isAgent ? <Dashboard incidents={incidents} profile={profile} onNavigate={handleNavigate} /> : <IncidentForm />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard incidents={incidents} profile={profile} onNavigate={handleNavigate} />;
      case 'users': return <UserManagement />;
      case 'map': return (
        <div className="h-[calc(100vh-64px)] p-8">
          <MapView 
            incidents={incidents} 
            focusIncident={mapFocus}
            onMarkerClick={(incident) => {
              setSearchQuery(incident.id);
              setActiveTab('incidents');
            }}
          />
        </div>
      );
      case 'register': return (
        <IncidentForm 
          editIncident={editingIncident} 
          onCancel={() => {
            setEditingIncident(null);
            setActiveTab('incidents');
          }} 
        />
      );
      case 'incidents': return (
        <IncidentList 
          incidents={incidents} 
          profile={profile} 
          initialSearch={searchQuery}
          initialFilter={initialFilter}
          onEdit={(incident) => {
            setEditingIncident(incident);
            setActiveTab('register');
          }}
          onLocate={(incident) => {
            setMapFocus(incident);
            setActiveTab('map');
          }}
        />
      );
      default: return isAdmin ? <Dashboard incidents={incidents} profile={profile} /> : <IncidentForm />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col lg:flex-row">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Mobile Header */}
      <header className="lg:hidden bg-[#f36c21] text-white p-4 flex items-center justify-between sticky top-0 z-[1001] shadow-lg h-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-7 h-7" />
          </button>

          <div className="bg-white p-1 rounded-lg w-14 h-14 flex items-center justify-center overflow-hidden shadow-sm">
            <img 
              src={LOGO_URL} 
              alt="Logo Defesa Civil Corupá" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="bg-white/10 p-2.5 rounded-xl hover:bg-white/20 transition-colors relative"
          >
            <Bell className="w-6 h-6" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#f36c21] animate-bounce">
                {unreadNotifications}
              </span>
            )}
          </button>

          <div
            onClick={() => setIsProfileOpen(true)}
            className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden bg-gray-200 shadow-sm cursor-pointer"
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm bg-primary/20">
                {profile?.displayName?.[0] || 'U'}
              </div>
            )}
          </div>

          <button
            onClick={() => auth.signOut()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-6 h-6 opacity-60" />
          </button>
        </div>
      </header>

      <main className="flex-1 lg:ml-64 min-h-screen relative">
        <NotificationManager />
        <OfflineSyncIndicator />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <NotificationModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigateToIncident={(id) => {
            setSearchQuery(id);
            setActiveTab('incidents');
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed bottom-8 right-8 z-[2000] bg-danger text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md border border-white/20"
            >
              <div className="bg-white/20 p-2 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Erro Crítico</p>
                <p className="text-xs text-white/80">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

