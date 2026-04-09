import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertTriangle, Clock, CheckCircle, Activity, TrendingUp, MapPin } from 'lucide-react';
import { type Incident, type Stats, type UserProfile, type IncidentCategory } from '../types';
import { getCategoryIcon } from '../lib/incidentIcons';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  incidents: Incident[];
  profile: UserProfile | null;
  onNavigate?: (tab: string, filter?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ incidents, profile, onNavigate }) => {
  const stats = useMemo(() => {
    const s: Stats = {
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

  const chartData = Object.entries(stats.byType).map(([name, value]) => ({ name, value }));
  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#6B7280'];

  const statCards = [
    { label: 'Total de Ocorrências', value: stats.total, icon: Activity, color: 'bg-primary', filter: 'Todos' },
    { label: 'Pendentes', value: stats.pending, icon: AlertTriangle, color: 'bg-danger', filter: 'Pendente' },
    { label: 'Em Atendimento', value: stats.inProgress, icon: Clock, color: 'bg-warning', filter: 'Em Atendimento' },
    { label: 'Resolvidos', value: stats.resolved, icon: CheckCircle, color: 'bg-success', filter: 'Resolvido' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight">
            Olá, {profile?.displayName || 'Operador'}
          </h2>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Dashboard Operacional • Estatísticas em tempo real.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-gray-600">Sistema Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate?.('incidents', card.filter)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110", card.color)} />
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl text-white shadow-lg", card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-bold text-primary">Ocorrências por Tipo</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Frequência
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg lg:text-xl font-bold text-primary mb-6 lg:mb-8">Distribuição</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6">
            {chartData.map((item, index) => {
              const CategoryIcon = getCategoryIcon(item.name as IncidentCategory);
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS[index % COLORS.length]}15`, color: COLORS[index % COLORS.length] }}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
