import React, { useState, useEffect } from 'react';
import { Map, Users, ChevronRight, GraduationCap, MapPin, Search, X } from 'lucide-react';
import { api, Student } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

interface VillageStats {
  name: string;
  studentCount: number;
  averageScore: number;
  attendanceRate: number;
  students: Student[];
}

export default function Villages() {
  const [villages, setVillages] = useState<VillageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<VillageStats | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [assigningLoading, setAssigningLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [studentsData, progress, attendance] = await Promise.all([
        api.getStudents(),
        api.getProgress(),
        api.getAttendance()
      ]);

      const unassigned = studentsData.filter(s => !s.village || s.village.trim() === '');
      setUnassignedStudents(unassigned);

      const groups: { [key: string]: Student[] } = {};
      studentsData.forEach(s => {
        const v = s.village && s.village.trim() !== '' ? s.village : 'General / Unassigned';
        if (!groups[v]) groups[v] = [];
        groups[v].push(s);
      });

      const stats = Object.entries(groups).map(([name, sList]) => {
        const sIds = sList.map(s => s.id);
        const scores = progress.filter(p => sIds.includes(p.studentId) && p.score > 0).map(p => p.score);
        const attend = attendance.filter(a => sIds.includes(a.studentId));
        
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const presentCount = attend.filter(a => a.status === 'Present').length;
        const attendanceRate = attend.length > 0 ? Math.round((presentCount / attend.length) * 100) : 0;

        return {
          name,
          studentCount: sList.length,
          averageScore: avgScore,
          attendanceRate,
          students: sList
        };
      });

      setVillages(stats.sort((a, b) => b.studentCount - a.studentCount));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAssign(villageName: string, studentId: string) {
    setAssigningLoading(true);
    try {
      await api.updateStudent(studentId, { village: villageName });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAssigningLoading(false);
    }
  }

  const filteredVillages = villages.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search villages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm shadow-sm"
          />
        </div>
        
        {unassignedStudents.length > 0 && (
          <button 
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-200 hover:bg-amber-100 transition-all text-xs uppercase tracking-widest shadow-sm"
          >
            <Users size={16} />
            {unassignedStudents.length} Unassigned Students
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVillages.length > 0 ? (
          filteredVillages.map((village, idx) => (
            <motion.div 
              key={village.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedVillage(village)}
              className="group bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16 group-hover:bg-blue-50 transition-colors" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-900/10">
                  <MapPin className="text-white" size={24} />
                </div>

                <h3 className="text-xl font-display font-bold text-slate-800 mb-1">{village.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{village.name === 'General / Unassigned' ? 'Uncategorized' : 'Regional Hub'}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-tighter mb-0.5">Students</p>
                    <p className="text-lg font-bold text-slate-800">{village.studentCount}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-tighter mb-0.5">Avg Score</p>
                    <p className="text-lg font-bold text-slate-800">{village.averageScore}%</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${village.attendanceRate}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{village.attendanceRate}% Attendance</span>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={18} />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Map size={32} className="text-slate-200" />
            </div>
            <h4 className="text-lg font-bold text-slate-400">
              {searchQuery ? 'No Matching Villages' : 'No Villages Found'}
            </h4>
            <p className="text-sm text-slate-400 max-w-sm">
              {searchQuery 
                ? `No results found for "${searchQuery}". Try a different search term.`
                : 'Assign village details to students in the "Students" section to see regional summaries here.'}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedVillage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedVillage(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-slate-800">{selectedVillage.name}</h3>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Village Insights</p>
                  </div>
                </div>
                <button onClick={() => setSelectedVillage(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Village Demographic</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <Users className="text-slate-300 mb-2" size={20} />
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Students</p>
                      <p className="text-2xl font-bold text-slate-800">{selectedVillage.studentCount}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <GraduationCap className="text-slate-300 mb-2" size={20} />
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Average Marks</p>
                      <p className="text-2xl font-bold text-slate-800">{selectedVillage.averageScore}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Enrolled Students</h4>
                  <div className="space-y-2">
                    {selectedVillage.students.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600 uppercase">
                            {s.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{s.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.class}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssignModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-8 flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-800">Quick Village Assignment</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Assign unassigned students to villages</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {unassignedStudents.map(s => (
                  <div key={s.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.class}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        onChange={(e) => handleQuickAssign(e.target.value, s.id)}
                        disabled={assigningLoading}
                        className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      >
                        <option value="">Move to...</option>
                        {villages.filter(v => v.name !== 'General / Unassigned').map(v => (
                          <option key={v.name} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Type a new village name in the student editor to create it</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
