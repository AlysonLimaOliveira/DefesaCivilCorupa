import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, handleFirestoreError, OperationType } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { Shield, LogIn, AlertCircle, Info, Phone, MessageCircle, Mail, Lock, UserPlus, Ghost } from 'lucide-react';
import { motion } from 'motion/react';
import { LOGO_URL } from '../constants';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("Erro login anônimo:", err);
      setError('Erro ao entrar como visitante. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Erro de login:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao processar sua solicitação. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Erro detalhado de login:", err);
      setError('O login com Google não é compatível com este dispositivo. Use e-mail e senha.');
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
        <div className="flex flex-col items-center text-center mb-6">
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

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white py-3.5 pl-12 pr-4 rounded-2xl outline-none transition-all font-medium text-gray-700"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white py-3.5 pl-12 pr-4 rounded-2xl outline-none transition-all font-medium text-gray-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                <span>{isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-center text-sm font-bold text-gray-400 hover:text-primary transition-colors"
          >
            {isRegistering ? 'Já tenho uma conta' : 'Ainda não tenho conta'}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-4 text-gray-300 font-bold tracking-widest">Acesso Rápido</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnonymousLogin}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-gray-200 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Ghost className="w-5 h-5" />
                <span>Entrar como Visitante</span>
              </>
            )}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Ou continue com</span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-3.5 px-6 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Google (Apenas Web)</span>
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
          <a href="tel:199" className="bg-white p-4 rounded-[28px] shadow-xl shadow-primary/5 flex flex-col items-center text-center border border-gray-50 group">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-gray-900">199</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Defesa Civil</span>
          </a>
          <a href="tel:193" className="bg-white p-4 rounded-[28px] shadow-xl shadow-primary/5 flex flex-col items-center text-center border border-gray-50 group">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-2">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-gray-900">193</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bombeiros</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
