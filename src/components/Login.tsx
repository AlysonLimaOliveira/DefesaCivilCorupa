import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, handleFirestoreError, OperationType } from '../firebase';
import { Shield, LogIn, AlertCircle, Info, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { LOGO_URL } from '../constants';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Erro detalhado de login:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Adicione este URL aos "Domínios Autorizados" no Console do Firebase.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de rede. Verifique sua conexão com a internet ou se algum bloqueador de anúncios (ad-blocker) está impedindo o acesso ao Firebase.');
      } else {
        setError(err.message || 'Erro ao realizar login com Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full -mr-[400px] -mt-[400px] blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full -ml-[300px] -mb-[300px] blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-primary/10 p-8 relative z-10 border border-gray-50 mb-4"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-white p-3 rounded-[28px] shadow-xl shadow-primary/10 mb-4 transform hover:scale-105 transition-transform duration-300 border border-gray-50">
            <img 
              src={LOGO_URL} 
              alt="Logo Defesa Civil Corupá" 
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight mb-1">Defesa Civil</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Corupá - Santa Catarina</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-3.5 px-6 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Entrar com Google</span>
              </>
            )}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-danger/10 border border-danger/20 p-3 rounded-2xl flex items-center gap-3 text-danger text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Versão 2.5.0 • 2026</p>
        </div>
      </motion.div>

      {/* Emergency Contacts Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-md w-full space-y-3 relative z-10"
      >
        <div className="grid grid-cols-2 gap-3">
          <a 
            href="tel:199" 
            className="bg-white p-4 rounded-[28px] shadow-xl shadow-primary/5 flex flex-col items-center text-center hover:scale-105 transition-transform border border-gray-50 group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter">199</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Defesa Civil</span>
          </a>

          <a 
            href="tel:193" 
            className="bg-white p-4 rounded-[28px] shadow-xl shadow-primary/5 flex flex-col items-center text-center hover:scale-105 transition-transform border border-gray-50 group"
          >
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter">193</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Bombeiros</span>
          </a>
        </div>

        <a 
          href="https://api.whatsapp.com/send?phone=554792574816&text=vim%20pelo%20app%20registrar%20minha%20ocorr%C3%AAncia."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-4 rounded-[28px] shadow-xl shadow-primary/5 flex flex-col items-center text-center hover:scale-105 transition-transform border border-gray-50 group"
        >
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-green-600 tracking-tighter">WhatsApp</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">DEFESA CIVIL DE CORUPÁ</span>
        </a>
      </motion.div>
    </div>
  );
};

export default Login;
