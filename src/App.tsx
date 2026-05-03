import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  LayoutDashboard, 
  GraduationCap, 
  Calendar,
  Map,
  BarChart3,
  LogOut
} from 'lucide-react';
import { api } from './lib/api';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import ProgressTracker from './components/ProgressTracker';
import Attendance from './components/Attendance';
import Villages from './components/Villages';
import RegionalAnalysis from './components/RegionalAnalysis';
import Auth from './components/Auth';
import EduBot from './components/EduBot';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('rural_tracker_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setChecking(false);
  }, []);

  const handleLogin = (userData: any) => {
    localStorage.setItem('rural_tracker_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('rural_tracker_user');
    setUser(null);
  };

  if (checking) return null;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/villages" element={<Villages />} />
          <Route path="/progress" element={<ProgressTracker />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/analysis" element={<RegionalAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <EduBot user={user} />
    </Router>
  );
}

function Layout({ children, user, onLogout }: { children: React.ReactNode, user: any, onLogout: () => void }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Villages', path: '/villages', icon: Map },
    { name: 'Curriculum', path: '/progress', icon: BookOpen },
    { name: 'Attendance', path: '/attendance', icon: Calendar },
    { name: 'Analysis', path: '/analysis', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 hidden md:flex flex-col shadow-xl">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-white tracking-tight leading-none">
                Rural Tracker
              </h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Educator Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {user.name?.[0].toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden text-sm">
                <p className="font-bold text-white truncate">{user.name}</p>
                <p className="text-slate-400 text-xs truncate">Administrator</p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800">
              {navItems.find(item => item.path === location.pathname)?.name || 'Insight'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-500 flex items-center gap-2">
              <Calendar size={14} />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
