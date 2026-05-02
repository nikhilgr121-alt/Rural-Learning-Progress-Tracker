import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import { api, Student, Progress } from '../lib/api';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function EduBot({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hello ${user?.name || 'Educator'}! I am EDU, your rural learning assistant. How can I help you today?` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [appContext, setAppContext] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      refreshContext();
    }
  }, [isOpen]);

  const refreshContext = async () => {
    try {
      const [students, progress, subjects] = await Promise.all([
        api.getStudents(),
        api.getProgress(),
        api.getSubjects()
      ]);

      const contextString = `
        User: ${user.name} (Role: Educator/Admin)
        Total Students: ${students.length}
        Active Subjects: ${subjects.join(', ')}
        Recent Student Records: ${students.slice(0, 5).map(s => `${s.name} (${s.class})`).join(', ')}
        Recent Progress Entries: ${progress.slice(0, 5).map(p => `${p.subject}: ${p.lesson} - ${p.status}`).join('; ')}
      `;
      setAppContext(contextString);
    } catch (err) {
      console.error("Context refresh error:", err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await aiService.getChatResponse(userMessage, history, appContext);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[400px] bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[550px]"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-6 flex items-center justify-between shadow-lg shadow-emerald-600/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-serif italic text-xl leading-none">EDU Assistant</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">AI Support Active</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-emerald-500' : 'bg-white border border-slate-100'}`}>
                      {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-emerald-600" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/10' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                      <Bot size={14} className="text-emerald-600" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-600/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-600/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-600/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask EDU anything..."
                  className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <Sparkles size={24} className="text-white animate-pulse" />
        </div>
        <MessageSquare size={24} className="relative z-10" />
      </motion.button>
    </div>
  );
}
