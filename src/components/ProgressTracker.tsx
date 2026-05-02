import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Filter, CheckCircle, Clock, X } from 'lucide-react';
import { api, Student, Progress } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

export default function ProgressTracker() {
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All Subjects');

  const [newProgressEntries, setNewProgressEntries] = useState([{ subject: '', score: 0, status: 'Completed' }]);
  const [newProgressLesson, setNewProgressLesson] = useState('');
  const [newProgressStudentId, setNewProgressStudentId] = useState('');
  
  const [newProgress, setNewProgress] = useState({
    studentId: '',
    subject: '',
    lesson: '',
    status: 'Completed' as any,
    score: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sData, pData, subData] = await Promise.all([
        api.getStudents(),
        api.getProgress(),
        api.getSubjects()
      ]);
      setStudents(sData);
      setProgress(pData);
      setSubjects(subData);
      if (sData.length > 0 && !newProgressStudentId) {
        setNewProgressStudentId(sData[0].id);
      }
      if (subData.length > 0) {
        setNewProgressEntries(prev => prev.map(entry => entry.subject ? entry : { ...entry, subject: subData[0] }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.batchAddProgress(newProgressStudentId, newProgressLesson, newProgressEntries);
      setIsAdding(false);
      setNewProgressLesson('');
      setNewProgressEntries([{ subject: subjects[0] || '', score: 0, status: 'Completed' }]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const addEntryRow = () => {
    setNewProgressEntries([...newProgressEntries, { subject: subjects[0] || '', score: 0, status: 'Completed' }]);
  };

  const removeEntryRow = (index: number) => {
    if (newProgressEntries.length > 1) {
      setNewProgressEntries(newProgressEntries.filter((_, i) => i !== index));
    }
  };

  const updateEntryRow = (index: number, field: string, value: any) => {
    const updated = [...newProgressEntries];
    updated[index] = { ...updated[index], [field]: value };
    setNewProgressEntries(updated);
  };

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      setLoading(true);
      const updated = await api.addSubject(newSubjectName.trim());
      setSubjects(updated);
      setNewProgress(prev => ({ ...prev, subject: newSubjectName.trim() }));
      setNewSubjectName('');
      setIsAddingSubject(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search lessons..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
          </div>
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-white px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none"
          >
            <option>All Subjects</option>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
        >
          <Plus size={18} />
          Log Lesson
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">Loading records...</div>
        ) : progress.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">No lessons logged yet.</div>
        ) : (
          [...progress]
            .reverse()
            .filter(p => {
              const student = students.find(s => s.id === p.studentId);
              const matchesSearch = p.lesson.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (student?.name.toLowerCase().includes(searchQuery.toLowerCase()));
              const matchesSubject = filterSubject === 'All Subjects' || p.subject === filterSubject;
              return matchesSearch && matchesSubject;
            })
            .map(p => {
              const student = students.find(s => s.id === p.studentId);
            return (
              <motion.div 
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-blue-50 text-blue-600`}>
                    <BookOpen size={20} />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-display font-bold text-slate-800">{p.score}%</span>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base leading-tight">{p.lesson}</h4>
                    <p className="text-xs font-semibold text-blue-500 mt-1 uppercase tracking-wider">{p.subject}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedStudentId(p.studentId)}
                      className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                    >
                       <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {student?.name[0] || '?'}
                       </div>
                       <span className="font-semibold text-slate-600">{student?.name || 'Unknown'}</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{p.date}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display font-bold text-slate-800">Log Lesson Progress</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Student</label>
                  <select 
                    required
                    value={newProgressStudentId}
                    onChange={e => setNewProgressStudentId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  >
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Lesson Title</label>
                  <input 
                    type="text" required
                    value={newProgressLesson}
                    onChange={e => setNewProgressLesson(e.target.value)}
                    placeholder="e.g. Weekly Review #4"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center pr-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest">Subjects & Scores</label>
                    <button 
                      type="button" 
                      onClick={addEntryRow}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Row
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                    {newProgressEntries.map((entry, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                        <div className="grid grid-cols-5 gap-3">
                          <div className="col-span-3">
                            <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Subject</label>
                            <select 
                              required
                              value={entry.subject}
                              onChange={e => updateEntryRow(idx, 'subject', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                            >
                              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                             <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Score (%)</label>
                             <div className="flex items-center gap-2">
                               <input 
                                 type="number" min="0" max="100" required
                                 value={entry.score || ''}
                                 onChange={e => updateEntryRow(idx, 'score', parseInt(e.target.value))}
                                 className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                               />
                               {newProgressEntries.length > 1 && (
                                 <button 
                                   type="button"
                                   onClick={() => removeEntryRow(idx)}
                                   className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                 >
                                   <X size={14} />
                                 </button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest shrink-0">
                    Log {newProgressEntries.length} Records
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {isAddingSubject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingSubject(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl">
              <h3 className="text-xl font-display font-bold text-slate-800 mb-6">New Subject</h3>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  required
                  placeholder="e.g. Environmental Art"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
                <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setIsAddingSubject(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 text-xs uppercase tracking-widest">Cancel</button>
                   <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-widest">Add</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudentId && (() => {
          const student = students.find(s => s.id === selectedStudentId);
          const studentHistory = progress.filter(p => p.studentId === selectedStudentId).reverse();
          const avgScore = studentHistory.length > 0 
            ? Math.round(studentHistory.reduce((acc, curr) => acc + curr.score, 0) / studentHistory.length) 
            : 0;

          return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setSelectedStudentId(null)} 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="relative bg-white w-full max-w-2xl h-[80vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Header Section */}
                <div className="bg-slate-900 p-8 text-white">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold uppercase">
                        {student?.name[0]}
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-bold">{student?.name}</h3>
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{student?.class}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedStudentId(null)} 
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Average Score</p>
                      <p className="text-2xl font-bold">{avgScore}%</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Lessons Logged</p>
                      <p className="text-2xl font-bold">{studentHistory.length}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Student Age</p>
                      <p className="text-2xl font-bold">{student?.age}yr</p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle className="text-blue-600 w-4 h-4" />
                    Learning History
                  </h4>
                  
                  <div className="space-y-4">
                    {studentHistory.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 italic text-sm">No progress records found for this student.</div>
                    ) : (
                      studentHistory.map((p) => (
                        <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              <BookOpen size={18} />
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 text-sm">{p.lesson}</p>
                               <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{p.subject}</span>
                                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock size={10} />
                                    {p.date}
                                  </span>
                               </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className={`text-lg font-bold ${p.score >= 80 ? 'text-emerald-500' : p.score >= 60 ? 'text-blue-500' : 'text-amber-500'}`}>
                                {p.score}%
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
