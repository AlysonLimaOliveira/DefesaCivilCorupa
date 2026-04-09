import React from 'react';
import { LayoutDashboard, Map as MapIcon, PlusCircle, List, LogOut, Shield, Menu, Settings, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, signOut } from '../firebase';
import { useAuth } from '../AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import ProfileModal from './ProfileModal';
import { LOGO_URL } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { profile, isAdmin } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'users', label: 'Usuários', icon: Users, adminOnly: true },
    { id: 'map', label: 'Mapa', icon: MapIcon, adminOnly: false },
    { id: 'register', label: 'Registrar', icon: PlusCircle, adminOnly: false },
    { id: 'incidents', label: 'Incidentes', icon: List, adminOnly: false },
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[9998] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "w-64 bg-primary text-white h-screen flex flex-col fixed left-0 top-0 z-[9999] transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between flex-row-reverse border-b border-white/10">
          <div 
            onClick={() => setActiveTab(isAdmin ? 'dashboard' : 'register')}
            className="flex items-center flex-row-reverse gap-3 text-right cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          >
            <div className="bg-white p-1 rounded-lg w-12 h-12 flex items-center justify-center overflow-hidden shadow-lg">
              <img 
                src={LOGO_URL} 
                alt="Logo Defesa Civil Corupá" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Defesa Civil</h1>
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Corupá - SC</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-white/10 text-white font-medium shadow-lg" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setIsProfileOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 mb-4 hover:bg-white/5 rounded-2xl transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            {profile?.displayName?.[0] || profile?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate group-hover:text-white transition-colors">{profile?.displayName || 'Usuário'}</p>
            <p className="text-xs text-white/60 truncate capitalize">{profile?.role}</p>
          </div>
          <Settings className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
        </button>
        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-danger/10 hover:text-danger transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
    </>
  );
};

export default Sidebar;
