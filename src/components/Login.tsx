tsx
import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile } from 'firebase/auth';
import { Shield, LogIn, AlertCircle, Phone, Mail, Lock, UserPlus, Ghost } from 'lucide-react';
import { LOGO_URL } from '../constants';
import { db, doc, setDoc } from '../firebase';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering) {
      if (!displayName.trim() || !cpf.trim() || !phone.trim()) {
        setError('Por favor, preencha todos os campos.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setLoading(true);
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
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Este e-mail já está em uso.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') setError('E-mail ou senha incorretos.');
      else setError('Erro ao processar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try { await signInAnonymously(auth); }
    catch (err) { setError('Erro ao entrar como visitante.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col items-center p-6 relative overflow-y-auto">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full -mr-[400px] -mt-[400px] blur-3xl" />

      <div className="w-full max-w-md my-auto relative z-10 py-8">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-gray-50">
          <div className="flex flex-col items-center text-center mb-6">
            <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mb-4" />
            <h1 className="text-3xl font-black text-primary">Defesa Civil</h1>
            <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest text-center">Corupá - Santa Catarina</p>
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 py-3.5 pl-12 pr-4 rounded-2xl outline-none font-medium text-gray-700"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 py-3.5 pl-12 pr-4 rounded-2xl outline-none font-medium text-gray-700"
                required
              />
            </div>

            {/* CAMPOS EXTRAS DE REGISTRO */}
            {isRegistering && (
              <div className="space-y-4 pt-2 border-t border-gray-100 mt-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 py-3.5 pl-12 pr-4 rounded-2xl outline-none font-medium text-gray-700"
                    required={isRegistering}
                  />
                </div>

                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 py-3.5 pl-12 pr-4 rounded-2xl outline-none font-medium text-gray-700"
                    required={isRegistering}
                  />
                </div>

                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="CPF"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 py-3.5 pl-12 pr-4 rounded-2xl outline-none font-medium text-gray-700"
                    required={isRegistering}
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 py-3.5 pl-12 pr-4 rounded-2xl outline-none font-medium text-gray-700"
                    required={isRegistering}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isRegistering ? 'CRIAR CONTA' : 'ENTRAR NO SISTEMA'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="w-full text-center text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest pt-2"
            >
              {isRegistering ? 'JÁ TENHO UMA CONTA' : 'AINDA NÃO TENHO CONTA'}
            </button>

            {error && (
              <div className="bg-danger/10 border border-danger/20 p-3 rounded-2xl flex items-center gap-3 text-danger text-[11px] font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </form>

          <div className="relative my-6 text-center">
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest bg-white px-2">Ou acesse como</span>
          </div>

          <button onClick={handleAnonymousLogin} className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4">
            <Ghost className="w-5 h-5" /> Visitante
          </button>
        </div>

        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center mt-8">
          VERSÃO 3.0.0 · 2026
        </p>

        {/* Emergency Contacts */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <a href="tel:199" className="bg-white p-4 rounded-[28px] shadow-xl flex flex-col items-center border border-gray-50">
            <span className="text-xl font-black text-gray-900">199</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-blue-500">Defesa Civil</span>
          </a>
          <a href="tel:193" className="bg-white p-4 rounded-[28px] shadow-xl flex flex-col items-center border border-gray-50">
            <span className="text-xl font-black text-gray-900">193</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-red-500">Bombeiros</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;