import React, { useState } from 'react';
import { db, doc, updateDoc, deleteDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { notifyUser } from '../services/notificationService';
import { type Incident, type IncidentStatus, type UserProfile } from '../types';
import { getCategoryIcon } from '../lib/incidentIcons';
import { AlertTriangle, Clock, CheckCircle, MapPin, Phone, User, ExternalLink, ChevronRight, Filter, Search, MoreVertical, Edit2, Trash2, X, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthProvider';
import { motion, AnimatePresence } from 'motion/react';

interface IncidentListProps {
  incidents: Incident[];
  profile: UserProfile | null;
  onEdit?: (incident: Incident) => void;
  onLocate?: (incident: Incident) => void;
  initialSearch?: string;
  initialFilter?: string;
}

const IncidentList: React.FC<IncidentListProps> = ({ incidents, profile, onEdit, onLocate, initialSearch = '', initialFilter = 'Todos' }) => {
  const { isAdmin, user } = useAuth();
  const [filter, setFilter] = useState<string>(initialFilter);
  const [search, setSearch] = useState(initialSearch);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedReporter, setSelectedReporter] = useState<Incident | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: IncidentStatus) => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'incidents', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Find the incident to get the reporterUid
      const incident = incidents.find(i => i.id === id);
      if (incident && incident.reporterUid) {
        await notifyUser(
          incident.reporterUid,
          'Atualização de Status',
          `Sua ocorrência de ${incident.category} agora está: ${newStatus}`,
          id
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `incidents/${id}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdating(id);
    try {
      await deleteDoc(doc(db, 'incidents', id));
      setIncidentToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `incidents/${id}`);
    } finally {
      setUpdating(null);
    }
  };

  const filteredIncidents = incidents.filter(i => {
    const matchesFilter = filter === 'Todos' || i.status === filter;
    const searchLower = (search || '').toLowerCase();
    
    const matchesSearch = i.id === search ||
                          (i.type?.toLowerCase() || '').includes(searchLower) || 
                          (i.category?.toLowerCase() || '').includes(searchLower) ||
                          (i.city?.toLowerCase() || '').includes(searchLower) ||
                          (i.description?.toLowerCase() || '').includes(searchLower) ||
                          (i.address?.toLowerCase() || '').includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-danger/10 text-danger border-danger/20';
      case 'Em Atendimento': return 'bg-warning/10 text-warning border-warning/20';
      case 'Resolvido': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight">
            Ocorrências de {profile?.displayName || 'Operador'}
          </h2>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Gerencie e acompanhe todos os incidentes registrados no sistema.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar ocorrência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-auto pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-200 sm:min-w-[280px]"
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
            {['Todos', 'Pendente', 'Em Atendimento', 'Resolvido'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  // Clear search if changing filter to see other results
                  if (f !== 'Todos') setSearch('');
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                  filter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredIncidents.map((incident, index) => (
            <motion.div
              layout
              key={incident.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl border", getStatusStyles(incident.status))}>
                      {incident.status === 'Pendente' ? <AlertTriangle className="w-5 h-5" /> :
                       incident.status === 'Em Atendimento' ? <Clock className="w-5 h-5" /> :
                       <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-lg leading-tight">{incident.type}</h4>
                        {(() => {
                          const CategoryIcon = getCategoryIcon(incident.category);
                          return (
                            <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold border border-gray-200 uppercase tracking-tighter">
                              <CategoryIcon className="w-3 h-3" />
                              {incident.category}
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                        {incident.city && <span className="text-primary mr-1">{incident.city} •</span>}
                        {incident.createdAt?.toDate ? format(incident.createdAt.toDate(), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Data indisponível'}
                      </p>
                    </div>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", getStatusStyles(incident.status))}>
                    {incident.status}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 relative group/desc">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{incident.description}</p>
                    
                    {/* User Actions (Edit/Delete) */}
                    {(isAdmin || incident.reporterUid === user?.uid) && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit?.(incident)}
                          className="p-1.5 bg-white text-primary rounded-lg shadow-sm border border-gray-100 hover:bg-primary hover:text-white transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setIncidentToDelete(incident.id)}
                          className="p-1.5 bg-white text-danger rounded-lg shadow-sm border border-gray-100 hover:bg-danger hover:text-white transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                      onClick={() => onLocate?.(incident)}
                      className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer hover:text-primary transition-colors group/loc"
                    >
                      <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover/loc:bg-primary group-hover/loc:text-white transition-all">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="truncate font-medium">{incident.address || 'Localização no mapa'}</span>
                    </div>
                    <div 
                      onClick={() => setSelectedReporter(incident)}
                      className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer hover:text-primary transition-colors group/rep"
                    >
                      <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover/rep:bg-primary group-hover/rep:text-white transition-all">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="truncate font-medium">{incident.reporterName || 'Anônimo'}</span>
                    </div>
                  </div>

                  {/* Photos Gallery */}
                  {incident.photos && incident.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {incident.photos.map((photo, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedImage(photo)}
                          className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        >
                          <img 
                            src={photo} 
                            alt={`Evidência ${i + 1}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {['Pendente', 'Em Atendimento', 'Resolvido'].map((status) => (
                        <button
                          key={status}
                          disabled={updating === incident.id || incident.status === status}
                          onClick={() => handleStatusUpdate(incident.id, status as IncidentStatus)}
                          className={cn(
                            "flex-1 sm:flex-none px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 border",
                            incident.status === status 
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                              : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        if (incident.location) {
                          window.open(`https://www.google.com/maps?q=${incident.location.lat},${incident.location.lng}`, '_blank');
                        }
                      }}
                      className="self-end sm:self-auto p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-all duration-200 shadow-sm"
                      title="Abrir no Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredIncidents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Search className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Nenhuma ocorrência encontrada</h3>
          <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou busca para encontrar o que procura.</p>
        </div>
      )}

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[90vh] lg:max-w-[70vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={selectedImage} 
                alt="Visualização ampliada" 
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reporter Info Modal */}
      <AnimatePresence>
        {selectedReporter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReporter(null)}
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-primary p-6 text-white relative">
                <button 
                  onClick={() => setSelectedReporter(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Informações do Relator</h3>
                    <p className="text-white/70 text-sm">Dados de contato da ocorrência</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome Completo</p>
                      <p className="font-bold text-gray-900">{selectedReporter.reporterName || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Telefone de Contato</p>
                      <p className="font-bold text-gray-900">{selectedReporter.reporterPhone || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CPF</p>
                      <p className="font-bold text-gray-900">{selectedReporter.reporterCPF || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedReporter(null)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {incidentToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIncidentToDelete(null)}
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Ocorrência?</h3>
                <p className="text-gray-500 text-sm mb-8">
                  Esta ação não pode ser desfeita. A ocorrência será removida permanentemente do sistema.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    disabled={updating === incidentToDelete}
                    onClick={() => handleDelete(incidentToDelete)}
                    className="w-full py-4 bg-danger text-white rounded-2xl font-bold hover:bg-danger/90 transition-all shadow-lg shadow-danger/20 flex items-center justify-center gap-2"
                  >
                    {updating === incidentToDelete ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Sim, Excluir Agora'
                    )}
                  </button>
                  <button
                    onClick={() => setIncidentToDelete(null)}
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

export default IncidentList;
