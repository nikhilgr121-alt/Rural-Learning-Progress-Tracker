import React, { useState, useEffect } from 'react';
import { BarChart3, MapPin, Sparkles, AlertCircle, Calendar, GraduationCap } from 'lucide-react';
import { api, Student, Progress, Attendance } from '../lib/api';
import { analyzeRegionalPerformance } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

export default function RegionalAnalysis() {
  const [villages, setVillages] = useState<string[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadBaseData();
  }, []);

  async function loadBaseData() {
    try {
      const [s, p, a] = await Promise.all([
        api.getStudents(),
        api.getProgress(),
        api.getAttendance()
      ]);
      setStudents(s);
      setProgress(p);
      setAttendance(a);
      
      const vNames = Array.from(new Set(s.map(st => st.village).filter(v => v && v.trim() !== ''))).sort();
      setVillages(vNames);
      if (vNames.length > 0) {
        setSelectedVillage(vNames[0]);
      } else {
        setSelectedVillage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const runAnalysis = async () => {
    if (!selectedVillage) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const villageStudents = students.filter(s => s.village === selectedVillage);
      const sIds = villageStudents.map(s => s.id);
      const villageProgress = progress.filter(p => sIds.includes(p.studentId));
      const villageAttendance = attendance.filter(a => sIds.includes(a.studentId));
      
      const report = await analyzeRegionalPerformance(
        selectedVillage,
        villageStudents,
        villageProgress,
        villageAttendance
      );
      setAnalysis(report);
    } catch (err) {
      console.error(err);
      setAnalysis("Error generating regional report. Check API keys.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <BarChart3 size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-slate-800">Regional Smart Analysis</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compare & Predict Educational Health</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Target Region</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={selectedVillage}
                  onChange={(e) => { setSelectedVillage(e.target.value); setAnalysis(null); }}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none font-bold text-slate-700 disabled:opacity-50"
                  disabled={villages.length === 0}
                >
                  {villages.length === 0 ? (
                    <option value="">No villages found</option>
                  ) : (
                    villages.map(v => <option key={v} value={v}>{v}</option>)
                  )}
                </select>
              </div>
            </div>
            <button 
              onClick={runAnalysis}
              disabled={analyzing || villages.length === 0}
              className="md:self-end px-8 py-4 bg-slate-900 text-white rounded-3xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:bg-slate-400 text-xs uppercase tracking-widest flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate Regional Report'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 rounded-[40px] border border-blue-100 shadow-xl shadow-blue-500/5 col-span-1 md:col-span-2"
            >
              <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xl font-display font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Sparkles size={16} className="text-blue-600" />
                    </div>
                    {selectedVillage} Report
                  </h4>
                  <div className="px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    AI Insights • Beta
                  </div>
              </div>

              <div className="space-y-6">
                {analysis.split('\n').filter(l => l.trim()).map((line, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 leading-relaxed text-sm text-slate-600 font-medium">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <p>{line.replace(/^[*-]\s*/, '').replace(/^\d+\.\s*/, '')}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 italic">Analysis based on current seasonal patterns and regional baseline.</p>
                <button className="text-xs font-bold text-blue-600 hover:underline">Share Report</button>
              </div>
            </motion.div>
          ) : !analyzing ? (
            <div className="col-span-1 md:col-span-2 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
                <BarChart3 size={48} className="text-slate-200 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-400">No Regional Data Processed</h4>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">Select a village above to generate a deep-dive educational analysis using Gemini Artificial Intelligence.</p>
            </div>
          ) : null}
        </AnimatePresence>

        {selectedVillage && !analysis && !analyzing && (
          <>
             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800">Regional Statistics</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-slate-500 font-medium tracking-tight">Active Students</span>
                    <span className="text-sm font-bold text-slate-800">{students.filter(s => s.village === selectedVillage).length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: '65%' }} />
                  </div>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Calendar size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800">Community Health</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2 text-rose-500">
                    <span className="text-xs font-bold uppercase tracking-widest">Pending Sync</span>
                    <AlertCircle size={14} />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Generate an AI report to see attendance patterns and community intervention suggestions.
                  </p>
                </div>
             </div>
          </>
        )}
      </div>
    </div>
  );
}
