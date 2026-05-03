import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, MoreVertical, Edit2, Trash2, X, Check, Sparkles, AlertCircle, QrCode, Share2, MapPin } from 'lucide-react';
import { api, Student } from '../lib/api';
import { analyzeStudentPerformance, predictPerformance } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [prediction, setPrediction] = useState<"Excellent" | "Average" | "Weak" | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', age: 10, class: '', village: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [villageFilter, setVillageFilter] = useState<string>('All Villages');

  useEffect(() => {
    loadStudents();
    
    // Check for student ID in URL
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('id');
    if (studentId) {
      api.getStudents().then(data => {
        const student = data.find(s => s.id === studentId);
        if (student) setViewingStudent(student);
      });
    }
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const [studentData, progressData] = await Promise.all([
        api.getStudents(),
        api.getProgress()
      ]);
      setStudents(studentData);
      setAllProgress(progressData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, newStudent);
        setEditingStudent(null);
      } else {
        await api.addStudent(newStudent);
      }
      setIsAdding(false);
      setNewStudent({ name: '', age: 10, class: '', village: '' });
      loadStudents();
    } catch (err) {
      console.error(err);
    }
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await api.deleteStudent(deletingId);
      setDeletingId(null);
      loadStudents();
      setActiveMenu(null);
      setViewingStudent(null);
    } catch (err) {
      console.error(err);
    }
  }

  function startEdit(student: Student) {
    setEditingStudent(student);
    setNewStudent({ name: student.name, age: student.age, class: student.class, village: student.village });
    setIsAdding(true);
    setActiveMenu(null);
  }

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(importData);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of students');
      await api.bulkAddStudents(parsed);
      setShowImport(false);
      setImportData('');
      loadStudents();
    } catch (err) {
      alert('Invalid JSON format. Please ensure it is an array of student objects with name, age, and class.');
    }
  };

  const generateAiInsights = async () => {
    if (!viewingStudent) return;
    setGeneratingAi(true);
    setAiReport(null);
    setPrediction(null);
    try {
      const [progress, attendance] = await Promise.all([
        api.getProgress(),
        api.getAttendance()
      ]);
      
      const sProgress = progress.filter(p => p.studentId === viewingStudent.id);
      const sAttendance = attendance.filter(a => a.studentId === viewingStudent.id);
      
      const [analysis, pred] = await Promise.all([
        analyzeStudentPerformance(viewingStudent, sProgress, sAttendance),
        predictPerformance(viewingStudent, sProgress, sAttendance)
      ]);
      
      setAiReport(analysis);
      setPrediction(pred);
    } catch (err) {
      console.error(err);
      setAiReport("Failed to generate AI report. Please check your connection or API configuration.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.class && s.class.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVillage = villageFilter === 'All Villages' || s.village === villageFilter;
    return matchesSearch && matchesVillage;
  });

  const villages = Array.from(new Set(students.map(s => s.village).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-sm"
            />
          </div>
          <select 
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-slate-600 shadow-sm"
          >
            <option>All Villages</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest shadow-sm"
          >
            Import Data
          </button>
          <button 
            onClick={() => { setIsAdding(true); setEditingStudent(null); setNewStudent({ name: '', age: 10, class: '', village: '' }); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Village</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Marks</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Learning Group</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm italic">Loading student database...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">No student records found.</td>
              </tr>
            ) : (
              filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setViewingStudent(s)}
                      className="flex items-center gap-3 text-left group/profile"
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm group-hover/profile:bg-blue-600 group-hover/profile:text-white transition-all shadow-sm">
                        {s.name[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-sm group-hover/profile:text-blue-600 transition-colors">{s.name}</span>
                        <p className="text-[10px] text-slate-400 font-medium">ID: {s.id.substring(0, 8)}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin size={12} className="text-slate-400" />
                      <span className="text-[11px] font-semibold">{s.village || 'Not Set'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const scores = allProgress.filter(p => p.studentId === s.id && p.score > 0).map(p => p.score);
                      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                      return avg !== null ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${avg > 80 ? 'bg-emerald-500' : avg > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <span className="font-bold text-slate-700 text-sm">{avg}%</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No Marks</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{s.age} yrs</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {s.class}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === s.id ? null : s.id); }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <MoreVertical size={16} />
                      </button>

                      <AnimatePresence>
                        {activeMenu === s.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-10 z-20 w-44 bg-white border border-slate-200 shadow-2xl rounded-2xl py-2 flex flex-col overflow-hidden"
                            >
                              <button 
                                onClick={(e) => { e.stopPropagation(); setViewingStudent(s); setActiveMenu(null); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
                              >
                                <Users size={16} className="text-blue-500" />
                                View Profile
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setViewingStudent(s); setShowQR(true); setActiveMenu(null); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
                              >
                                <QrCode size={16} className="text-emerald-500" />
                                Share QR Code
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); startEdit(s); setActiveMenu(null); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
                              >
                                <Edit2 size={16} className="text-indigo-500" />
                                Edit Record
                              </button>
                              <div className="h-px bg-slate-100" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingId(s.id); setActiveMenu(null); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 transition-colors text-left"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display font-bold text-slate-800">
                  {editingStudent ? 'Edit Student Record' : 'New Student Record'}
                </h3>
                <button onClick={() => { setIsAdding(false); setEditingStudent(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Full Name</label>
                  <input 
                    type="text" required
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="Enter student's full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Age</label>
                    <input 
                      type="number" required
                      value={newStudent.age || ''}
                      onChange={e => setNewStudent({...newStudent, age: parseInt(e.target.value)})}
                      placeholder="e.g. 10"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Grade</label>
                    <input 
                      type="text" required
                      value={newStudent.class}
                      onChange={e => setNewStudent({...newStudent, class: e.target.value})}
                      placeholder="e.g. Grade 4"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Village Name</label>
                    <input 
                      type="text" required
                      list="village-list"
                      value={newStudent.village}
                      onChange={e => setNewStudent({...newStudent, village: e.target.value})}
                      placeholder="e.g. Kampur"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
                    />
                    <datalist id="village-list">
                      {Array.from(new Set(students.map(s => s.village).filter(Boolean))).map(v => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Academic Year</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold">
                      <option>2024-25</option>
                      <option>2023-24</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingStudent(null); }} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm uppercase tracking-widest">Cancel</button>
                  <button type="submit" className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all text-sm uppercase tracking-widest">
                    {editingStudent ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Detail View */}
      <AnimatePresence>
        {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingStudent(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="w-full md:w-1/3 bg-slate-900 p-8 flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-blue-600/40 mb-6 uppercase">
                    {viewingStudent.name[0]}
                 </div>
                 <h3 className="text-xl font-display font-bold text-white mb-1">{viewingStudent.name}</h3>
                 <p className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">{viewingStudent.class}</p>
                 
                 <div className="mt-8 space-y-4 w-full">
                    <button 
                      onClick={() => setShowQR(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest border border-emerald-500/20"
                    >
                      <QrCode size={14} />
                      Share Profile
                    </button>
                    <button 
                      onClick={() => startEdit(viewingStudent)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <Edit2 size={14} />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => setDeletingId(viewingStudent.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <Trash2 size={14} />
                      Delete Student
                    </button>
                 </div>
              </div>

              <div className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-lg font-display font-bold text-slate-800">Student Overview</h4>
                  <button onClick={() => setViewingStudent(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={20} /></button>
                </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Village</p>
                        <p className="text-sm font-bold text-slate-800">{viewingStudent.village || 'N/A'}</p>
                      </div>
                      <button 
                        onClick={() => window.location.href = '/villages'}
                        className="mt-2 text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider hover:bg-blue-100 transition-all border border-blue-100 w-fit"
                      >
                        View Village Hub
                      </button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Avg Score</p>
                      {(() => {
                        const scores = allProgress.filter(p => p.studentId === viewingStudent.id && p.score > 0).map(p => p.score);
                        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                        return (
                          <div className="flex items-end gap-1">
                            <p className="text-xl font-bold text-slate-800">{avg !== null ? `${avg}%` : 'N/A'}</p>
                            {avg !== null && <span className={`text-[8px] font-black uppercase mb-1 ${avg > 80 ? 'text-emerald-500' : avg > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                              {avg > 80 ? 'Excelling' : avg > 50 ? 'Steady' : 'Focus Needed'}
                            </span>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Performance Advisor</h5>
                    {!aiReport && !generatingAi && (
                      <button 
                        onClick={generateAiInsights}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1"
                      >
                        <Sparkles size={12} /> Generate
                      </button>
                    )}
                  </div>
                  
                  <div className="p-1 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-100 min-h-[120px] flex flex-col items-center justify-center text-center">
                    {generatingAi ? (
                      <div className="w-full space-y-2 p-4">
                        <div className="h-2 w-3/4 bg-blue-100 rounded animate-pulse mx-auto" />
                        <div className="h-2 w-full bg-blue-100 rounded animate-pulse mx-auto" />
                        <div className="h-2 w-5/6 bg-blue-100 rounded animate-pulse mx-auto" />
                      </div>
                    ) : aiReport ? (
                      <div className="p-4 space-y-3 text-left">
                        {prediction && (
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Classification:</span>
                               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                 prediction === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                                 prediction === 'Average' ? 'bg-amber-100 text-amber-700' :
                                 'bg-rose-100 text-rose-700'
                               }`}>
                                 {prediction}
                               </span>
                             </div>
                             {prediction === 'Weak' && (
                               <div className="flex gap-1 animate-pulse">
                                 <AlertCircle size={12} className="text-rose-500" />
                                 <span className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter">At Risk</span>
                               </div>
                             )}
                          </div>
                        )}
                        {aiReport.split('\n').filter(line => line.trim()).slice(0, 4).map((line, i) => (
                           <div key={i} className="flex gap-2 text-[11px] text-slate-600 leading-relaxed font-bold">
                              <span className="text-blue-500 font-bold shrink-0">→</span>
                              <span>{line.replace(/^[*-]\s*/, '').replace(/^\d+\.\s*/, '')}</span>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 mx-auto">
                        <Sparkles size={24} className="text-blue-200 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-400 font-medium italic">Compare marks & attendance history with AI</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Attendance Rate</p>
                      <p className="text-lg font-bold text-emerald-700">94.2%</p>
                    </div>
                    <Check className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && viewingStudent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQR(false)} className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }} 
              className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-10 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-emerald-600 -translate-y-16 skew-y-6" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center mb-6">
                   <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-2xl uppercase">
                     {viewingStudent.name[0]}
                   </div>
                </div>
                
                <h3 className="text-2xl font-display font-bold text-slate-800 mb-1">{viewingStudent.name}</h3>
                <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] mb-8">{viewingStudent.class} • Profile Card</p>

                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 mb-8 flex flex-col items-center shadow-inner">
                  <QRCodeSVG 
                    value={window.location.origin + "/students?id=" + viewingStudent.id} 
                    size={160}
                    level="H"
                    includeMargin={false}
                    className="p-2 bg-white rounded-xl shadow-lg border border-slate-200"
                  />
                  <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scan to view digital records</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowQR(false)} 
                    className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      const url = window.location.origin + "/students?id=" + viewingStudent.id;
                      navigator.clipboard.writeText(url);
                      alert('Profile link copied to clipboard!');
                    }}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} />
                    Copy Link
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }} 
              className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-slate-800">Bulk Import Students</h3>
                <button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste a JSON array of student objects. Each object should have <b>name</b>, <b>age</b>, and <b>class</b>.
                </p>
                <textarea 
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder='[{"name": "Student Name", "age": 10, "class": "Grade 4", "village": "Village Name"}]'
                  className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-mono"
                />
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setImportData('[{"name": "Arun K", "age": 10, "class": "Grade 4", "village": "Kampur"}, {"name": "Meena S", "age": 9, "class": "Grade 3", "village": "Sohanpur"}]')}
                    className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Load Sample
                  </button>
                </div>
                <button 
                  onClick={handleBulkImport}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all text-xs uppercase tracking-widest mt-4"
                >
                  Process Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deletion Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="relative bg-white w-full max-w-sm p-8 rounded-[32px] shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-800 mb-2">Delete Student?</h3>
              <p className="text-slate-500 text-sm mb-8">This action is permanent and will delete all associated progress records.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingId(null)} 
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
