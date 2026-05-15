import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { AlertTriangle, Clock, CheckCircle, Activity, TrendingUp, MapPin, ChevronRight, Plus, Map as MapIcon, Users, FileText } from 'lucide-react';
import { type Incident, type UserProfile, type IncidentCategory } from '../types';
import { getCategoryIcon } from '../lib/incidentIcons';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  incidents: Incident[];
  profile: UserProfile | null;
  onNavigate?: (tab: string, filter?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ incidents, profile, onNavigate }) => {
  const stats = useMemo(() => {
    const s = {
      total: incidents.length,
      pending: incidents.filter(i => i.status === 'Pendente').length,
      inProgress: incidents.filter(i => i.status === 'Em Atendimento').length,
      resolved: incidents.filter(i => i.status === 'Resolvido').length,
      byType: {
        "Hidrológica": 0,
        "Geológica": 0,
        "Meteorológica": 0,
        "Climatológica": 0,
        "Estrutural": 0,
        "Incêndio": 0,
        "Tecnológica": 0,
        "Risco Potencial": 0
      }
    };

    incidents.forEach(i => {
      if (i.category && s.byType[i.category] !== undefined) {
        s.byType[i.category]++;
      }
    });

    return s;
  }, [incidents]);

  const recentIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    }).slice(0, 5);
  }, [incidents]);

  const chartData = Object.entries(stats.byType).map(([name, value]) => ({ name, value }));

  // Cores institucionais (Laranja como destaque principal)
  const COLORS = {
    primary: '#FF6B00',
    secondary: '#003366',
    pending: '#EF4444',
    progress: '#F59E0B',
    success: '#10B981',
    chart: ['#FF6B00', '#003366', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6B7280']
  };

  const statCards = [
    { label: 'Total Registrado', value: stats.total, icon: FileText, color: 'from-blue-600 to-blue-700', shadow: 'shadow-blue-200', filter: 'Todos', trend: '+12%' },
    { label: 'Pendentes', value: stats.pending, icon: AlertTriangle, color: 'from-red-500 to-red-600', shadow: 'shadow-red-200', filter: 'Pendente', trend: 'Crítico' },
    { label: 'Em Atendimento', value: stats.inProgress, icon: Clock, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-200', filter: 'Em Atendimento', trend: 'Ativo' },
    { label: 'Resolvidos', value: stats.resolved, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200', filter: 'Resolvido', trend: 'Concluído' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header com Boas-vindas e Ações Rápidas */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full">
              Painel de Controle v3.0
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SISTEMA ONLINE
            </div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            Olá, <span className="text-orange-600">{profile?.displayName?.split(' ')[0] || 'Cidadão'}</span>
          </h2>
          <p className="text-gray-500 font-medium">Gerenciamento de Defesa Civil em Tempo Real · Corupá/SC</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate?.('register')}
            className="flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nova Ocorrência
          </button>
          <button
            onClick={() => onNavigate?.('map')}
            className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 rounded-2xl font-bold shadow-sm transition-all active:scale-95"
          >
            <MapIcon className="w-5 h-5" />
            Ver Mapa
          </button>
        </div>
      </div>

      {/* Grid de Estatísticas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate?.('incidents', card.filter)}
            className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 relative overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-4 rounded-2xl text-white bg-gradient-to-br shadow-lg", card.color, card.shadow)}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-2 py-1 rounded-lg uppercase">
                {card.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-gray-900 mt-1">{card.value}</p>
                <div className="mb-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        {/* Gráfico Principal */}
        <div className="xl:col-span-8 bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Ocorrências por Categoria</h3>
              <p className="text-sm text-gray-400 font-medium">Volume de registros por tipo de desastre</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                <Activity className="w-3.5 h-3.5 text-orange-500" />
                DADOS ATUAIS
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '20px',
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '16px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? COLORS.primary : COLORS.secondary}
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimas Ocorrências */}
        <div className="xl:col-span-4 bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Atividade Recente</h3>
            <button
              onClick={() => onNavigate?.('incidents')}
              className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
            >
              Ver Tudo <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {recentIncidents.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 font-medium">Nenhuma ocorrência recente.</p>
              </div>
            ) : (
              recentIncidents.map((incident, idx) => {
                const CategoryIcon = getCategoryIcon(incident.category);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={incident.id}
                    onClick={() => onNavigate?.('incidents', incident.id)}
                    className="flex items-center gap-4 p-4 rounded-3xl hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-gray-900 truncate tracking-tight">{incident.type || incident.category}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-300" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate">{incident.address || 'Local não informado'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-lg uppercase",
                        incident.status === 'Pendente' ? 'bg-red-50 text-red-500' :
                        incident.status === 'Em Atendimento' ? 'bg-orange-50 text-orange-500' :
                        'bg-emerald-50 text-emerald-500'
                      )}>
                        {incident.status}
                      </span>
                      <p className="text-[9px] text-gray-300 font-bold mt-1 uppercase">
                        {incident.createdAt?.toDate ? format(incident.createdAt.toDate(), "HH:mm") : 'Agora'}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50">
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-orange-100">
              <div className="relative z-10">
                <h4 className="text-lg font-black mb-1 leading-tight">Canal de Alertas</h4>
                <p className="text-white/80 text-xs font-medium mb-4">Envie notificações em massa para todos os agentes em campo.</p>
                <button className="w-full py-3 bg-white text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                  Emitir Alerta Geral
                </button>
              </div>
              <Activity className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
