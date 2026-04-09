import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, handleFirestoreError, OperationType, doc, updateDoc } from '../firebase';
import { type UserProfile } from '../types';
import { Users, Mail, Shield, User as UserIcon, Search, Filter, Settings, AlertTriangle, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'operator'>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; user: UserProfile | null }>({
    isOpen: false,
    user: null
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      setUsers(userData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleRole = async () => {
    if (updatingUid || !confirmModal.user) return;
    
    const user = confirmModal.user;
    const isPromoting = user.role === 'operator';
    const newRole = isPromoting ? 'admin' : 'operator';

    setUpdatingUid(user.uid);
    setConfirmModal({ isOpen: false, user: null });
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole
      });
    } catch (err) {
      console.error("Error updating user role:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Gestão de Usuários</h1>
          <p className="text-gray-500 font-medium mt-1">Visualize e gerencie todos os membros da equipe</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary/20 focus:ring-0 transition-all w-full sm:w-64 font-medium"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="pl-12 pr-10 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary/20 focus:ring-0 transition-all appearance-none font-medium text-gray-600"
            >
              <option value="all">Todos os Cargos</option>
              <option value="admin">Administradores</option>
              <option value="operator">Operadores</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-6 rounded-[32px] border-2 border-gray-50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner",
                user.role === 'admin' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
              )}>
                {user.displayName?.[0] || user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{user.displayName || 'Sem Nome'}</h3>
                  {user.role === 'admin' && (
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  user.role === 'admin' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                )}>
                  {user.role === 'admin' ? 'Administrador' : 'Operador'}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-400 font-medium">
                UID: <span className="font-mono">{user.uid.slice(0, 8)}...</span>
              </div>
              <button 
                onClick={() => setConfirmModal({ isOpen: true, user })}
                disabled={updatingUid === user.uid}
                className={cn(
                  "px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-sm",
                  updatingUid === user.uid ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" : 
                  user.role === 'admin' ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                title={user.role === 'admin' ? "Rebaixar para Operador" : "Promover para Administrador"}
              >
                {updatingUid === user.uid ? (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    {user.role === 'admin' ? 'Rebaixar' : 'Promover'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Nenhum usuário encontrado</h3>
          <p className="text-gray-500 mt-2">Tente ajustar seus filtros de busca</p>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && confirmModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmModal({ isOpen: false, user: null })}
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 text-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                  confirmModal.user.role === 'operator' ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-600"
                )}>
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  {confirmModal.user.role === 'operator' ? 'Promover Usuário?' : 'Rebaixar Usuário?'}
                </h3>
                <p className="text-gray-500 font-medium mb-8">
                  Deseja alterar o cargo de <span className="text-gray-900 font-bold">{confirmModal.user.displayName || confirmModal.user.email}</span> para 
                  <span className="text-primary font-bold"> {confirmModal.user.role === 'operator' ? 'Administrador' : 'Operador'}</span>?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleToggleRole}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all",
                      confirmModal.user.role === 'operator' ? "bg-primary hover:bg-primary/90 shadow-primary/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    )}
                  >
                    Sim, Confirmar Alteração
                  </button>
                  <button
                    onClick={() => setConfirmModal({ isOpen: false, user: null })}
                    className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function for class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default UserManagement;
