import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Calendar, Search, Save, Sparkles, UserCheck } from 'lucide-react';
import { api, Student, Attendance as AttendanceType } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, aData] = await Promise.all([
        api.getStudents(),
        api.getAttendance(date)
      ]);
      setStudents(sData);
      
      const attMap: Record<string, 'Present' | 'Absent' | 'Late'> = {};
      sData.forEach(s => {
        const record = aData.find(a => a.studentId === s.id);
        attMap[s.id] = record ? record.status : 'Present'; // Default to Present
      });
      setAttendance(attMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        date,
        status
      }));
      await api.saveAttendance(records);
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    present: Object.values(attendance).filter(s => s === 'Present').length,
    absent: Object.values(attendance).filter(s => s === 'Absent').length,
    late: Object.values(attendance).filter(s => s === 'Late').length,
  };

  const markAllPresent = () => {
    const newAtt = { ...attendance };
    students.forEach(s => {
      newAtt[s.id] = 'Present';
    });
    setAttendance(newAtt);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-semibold text-slate-700 shadow-sm"
            />
          </div>
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Search students..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
             />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={markAllPresent}
            className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-100 px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-all text-[10px] uppercase tracking-widest shadow-sm"
          >
            Mark All Present
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 text-sm whitespace-nowrap"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm outline-none ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}
          >
            <div className="flex items-center gap-3">
               <Sparkles size={18} />
               <p className="text-sm font-bold">{message.text}</p>
            </div>
            <button onClick={() => setMessage(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <UserCheck size={20} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Daily Roll Call</h3>
           </div>
           <p className="text-[10px] font-bold text-slate-400">TOTAL: {filteredStudents.length} STUDENTS</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[40%]">Student</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Grade</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic text-sm">Loading students...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 text-sm">No students found matching your search.</td></tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs ring-2 ring-transparent group-hover:ring-emerald-500/20 group-hover:bg-white transition-all">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider">ID: {s.id.substr(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">{s.class}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => updateStatus(s.id, 'Present')}
                          className={`w-28 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            attendance[s.id] === 'Present' 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Check size={14} /> Present
                        </button>
                        <button 
                          onClick={() => updateStatus(s.id, 'Absent')}
                          className={`w-28 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            attendance[s.id] === 'Absent' 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <X size={14} /> Absent
                        </button>
                        <button 
                          onClick={() => updateStatus(s.id, 'Late')}
                          className={`w-28 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            attendance[s.id] === 'Late' 
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Clock size={14} /> Late
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
