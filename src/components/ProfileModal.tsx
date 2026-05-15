import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { X, User, Mail, Shield, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sincroniza os campos quando o perfil carregar
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhotoURL(profile.photoURL || '');
    }
  }, [profile, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName,
        photoURL: photoURL,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full h-full bg-white overflow-y-auto no-scrollbar"
          >
            <div className="bg-primary p-8 pb-12 text-white relative rounded-b-[40px] shadow-2xl">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-3 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center mt-4">
                <div className="w-28 h-28 rounded-full bg-accent border-4 border-white/20 flex items-center justify-center text-4xl font-bold mb-6 shadow-2xl overflow-hidden relative">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setPhotoURL('')}
                    />
                  ) : (
                    <span className="text-white">
                      {displayName?.[0] || profile?.email?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-center px-4">
                  {profile?.displayName || user?.displayName || 'Usuário'}
                </h2>
                <div className="mt-2 px-4 py-1 bg-white/10 rounded-full">
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{profile?.role}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 pb-20 max-w-2xl mx-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nome de Exibição</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">URL da Foto de Perfil</label>
                <div className="relative group">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://link-da-sua-foto.com/foto.jpg"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-gray-900"
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1 font-medium">
                  Dica: Você pode usar links do Google Drive, Imgur ou redes sociais.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profile?.email}
                    disabled
                    className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl cursor-not-allowed text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
                <div className="relative opacity-60">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile?.role === 'admin' ? 'Administrador' : 'Operador'}
                    disabled
                    className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl cursor-not-allowed capitalize text-gray-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading || (displayName === profile?.displayName && photoURL === profile?.photoURL)}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : success ? (
                  <>Salvo com Sucesso!</>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
