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
import { db, collection, query, onSnapshot, handleFirestoreError, OperationType, where, auth } from './firebase';
import { type Incident } from './types';
import { syncOfflineIncidents } from './services/offlineService';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Menu, Bell, LogOut } from 'lucide-react';
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

  useEffect(() => {
    if (navigator.onLine) syncOfflineIncidents();
  }, []);

  useEffect(() => {
    if (!loading && user && !isAgent && activeTab === 'dashboard') {
      setActiveTab('register');
    }
  }, [loading, user, isAgent, activeTab]);

  useEffect(() => {
    if (!user || loading) return;

    // Monitoramento de Notificações - Filtro em memória para máxima resiliência
    const qNotif = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const unread = snapshot.docs.filter(d => !d.data().read).length;
      setUnreadNotifications(unread);
    }, (err) => {
      console.error("Erro no contador de notificações:", err);
    });

    // Monitoramento de Incidentes
    const qIncidents = isAgent
      ? query(collection(db, 'incidents'))
      : query(collection(db, 'incidents'), where('reporterUid', '==', user.uid));

    const unsubIncidents = onSnapshot(qIncidents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Incident[];
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setIncidents(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'incidents');
      setError("Erro ao sincronizar dados.");
    });

    return () => {
      unsubNotif();
      unsubIncidents();
    };
  }, [user, loading, isAgent]);

  const handleNavigate = (tab: string, filter?: string) => {
    setActiveTab(tab);
    if (filter) setInitialFilter(filter);
    else if (tab !== 'incidents') setInitialFilter('Todos');

    if (tab !== 'incidents') setSearchQuery('');
    if (tab !== 'map') setMapFocus(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center gap-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
          <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain" />
          </div>
        </motion.div>
        <h2 className="text-xl font-bold text-primary tracking-tight">Defesa Civil Corupá</h2>
      </div>
    );
  }

  if (!user) return <Login />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard incidents={incidents} profile={profile} onNavigate={handleNavigate} />;
      case 'users': return <UserManagement />;
      case 'map': return (
        <div className="h-[calc(100vh-64px)] p-4 lg:p-8">
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
      default: return <Dashboard incidents={incidents} profile={profile} onNavigate={handleNavigate} />;
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
      <header className="lg:hidden bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-[1001] shadow-lg h-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Menu className="w-7 h-7" />
          </button>
          <div className="bg-white p-1 rounded-lg w-12 h-12 flex items-center justify-center shadow-sm">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="bg-white/10 p-2.5 rounded-xl relative active:scale-90 transition-transform"
          >
            <Bell className="w-6 h-6" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-primary animate-bounce">
                {unreadNotifications}
              </span>
            )}
          </button>

          <div
            onClick={() => setIsProfileOpen(true)}
            className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden bg-gray-200 cursor-pointer active:scale-90 transition-transform"
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm bg-primary/20">
                {profile?.displayName?.[0] || 'U'}
              </div>
            )}
          </div>

          <button onClick={() => auth.signOut()} className="p-2 hover:bg-white/10 rounded-lg">
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
          unreadCountFromApp={unreadNotifications}
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
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="fixed bottom-8 right-8 z-[2000] bg-danger text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-xs font-bold flex-1">{error}</p>
              <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
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
