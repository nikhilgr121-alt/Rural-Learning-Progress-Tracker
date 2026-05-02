import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, BookOpen, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, Stats, Progress } from '../lib/api';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, progressData] = await Promise.all([
          api.getStats(),
          api.getProgress()
        ]);
        setStats(statsData);
        setProgress(progressData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center p-20 text-slate-400">Loading metrics...</div>;

  const chartData = progress.map(p => ({
    name: p.lesson.substring(0, 8) + '...',
    score: p.score
  })).slice(-6);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/students" className="block">
          <StatCard 
            title="Total Students" 
            value={stats?.totalStudents || 0} 
            icon={<Users className="w-6 h-6 text-blue-600" />}
            trend="+4 this month"
            color="bg-blue-50"
          />
        </Link>
        <Link to="/progress" className="block">
          <StatCard 
            title="Lessons Logged" 
            value={stats?.lessonsCompleted || 0} 
            icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
            trend="+12 this week"
            color="bg-indigo-50"
          />
        </Link>
        <div className="block">
          <StatCard 
            title="Avg. Performance" 
            value={`${stats?.averageScore || 0}%`} 
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            trend="Steady progress"
            color="bg-emerald-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-bold text-slate-800">Learning Progress</h3>
            <select className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 border-none focus:ring-0">
              <option>Last 7 Lessons</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                <YAxis fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent logs */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-display font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {progress.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 h-full text-slate-400 text-sm">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p>No activity yet</p>
              </div>
            ) : (
              [...progress].reverse().map(p => (
                <div key={p.id} className="group relative pl-4 border-l-2 border-slate-100 hover:border-blue-500 transition-colors pb-4 last:pb-0">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">{p.subject}</p>
                  <h4 className="text-sm font-semibold text-slate-700 leading-tight mb-1">{p.lesson}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{p.date}</span>
                    <span className="font-bold text-blue-600">{p.score}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-display font-bold text-slate-800">{value}</h4>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="text-emerald-500 font-bold">{trend}</span>
      </div>
    </motion.div>
  );
}
