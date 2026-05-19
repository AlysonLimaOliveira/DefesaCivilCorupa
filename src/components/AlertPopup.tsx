import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react';

interface AlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    message: string;
    incidentId?: string;
  } | null;
  onViewDetails?: (id: string) => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({ isOpen, onClose, data, onViewDetails }) => {
  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-red-600/90 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Top Danger Bar */}
            <div className="h-2 bg-red-500 w-full" />

            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center animate-bounce shadow-lg shadow-red-100">
                  <ShieldAlert className="w-10 h-10" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
                  {data.title}
                </h2>
                <div className="inline-block px-4 py-1.5 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                  Alerta Crítico da Defesa Civil
                </div>
                <p className="text-gray-600 text-lg leading-relaxed font-medium">
                  {data.message}
                </p>
              </div>

              <div className="space-y-4">
                {data.incidentId && (
                  <button
                    onClick={() => onViewDetails?.(data.incidentId!)}
                    className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-3xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-gray-200"
                  >
                    VER DETALHES NO MAPA
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-3xl font-bold transition-all active:scale-95"
                >
                  FECHAR AVISO
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Corupá - Defesa Civil Sempre Atenta
              </p>
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AlertPopup;
