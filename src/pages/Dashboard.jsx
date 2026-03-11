import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Sparkles, Download, Plus, Trash2, Send, Wallet, Mic, MicOff, Calendar as CalendarIcon, Coins, TrendingUp, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import SubscriptionManager from '../components/SubscriptionManager';
import Gamification from '../components/Gamification';
import ExpenseCalendar from '../components/ExpenseCalendar';

const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7'];

const Dashboard = () => {
  const { user, setSalary } = useContext(AuthContext);
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [insight, setInsight] = useState('');
  const [fraudAlert, setFraudAlert] = useState(null);
  const [savingSuggestion, setSavingSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [aiText, setAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [manualForm, setManualForm] = useState({ amount: '', category: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', mood: 'Normal', location: '' });
  const [isListening, setIsListening] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(user?.monthly_salary || 0);

  useEffect(() => {
    if (user?.monthly_salary !== undefined) {
      setSalaryInput(user.monthly_salary);
    }
  }, [user]);

  // Voice Recognition Logic
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onnomatch = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAiText(transcript);
    };

    recognition.start();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, insRes, subRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/ai/insights').catch(() => ({ data: { insight: 'AI insights unavailable right now. Please check your API key.', fraudAlert: null, savingSuggestion: null } })),
        api.get('/subscriptions')
      ]);
      setExpenses(expRes.data || []);
      setSubscriptions(subRes.data || []);
      setInsight(insRes?.data?.insight || '');
      setFraudAlert(insRes?.data?.fraudAlert || null);
      setSavingSuggestion(insRes?.data?.savingSuggestion || null);
    } catch (error) {
      // Silent fail - data will show as empty
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryUpdate = async () => {
    try {
      await setSalary(parseFloat(salaryInput));
      setIsEditingSalary(false);
    } catch (error) {
      toast.error('Failed to update salary.');
    }
  };

  // Calculations
  const currentMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= startOfMonth(new Date()) && expenseDate <= endOfMonth(new Date());
  });

  const totalMonthlyExpenses = currentMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const totalMonthlySubscriptions = subscriptions.reduce((sum, s) => {
    return sum + (s.billing_cycle === 'monthly' ? parseFloat(s.amount) : parseFloat(s.amount) / 12);
  }, 0);

  const remainingBalance = (user?.monthly_salary || 0) - totalMonthlyExpenses - totalMonthlySubscriptions;
  const healthScore = user?.monthly_salary > 0 ? Math.max(0, Math.min(100, (remainingBalance / user.monthly_salary) * 100)) : 0;

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiText) return;
    setIsAiLoading(true);
    try {
      const res = await api.post('/ai/extract', { text: aiText });
      const extracted = res.data;
      
      // Immediately save it
      await api.post('/expenses', extracted);
      setAiText('');
      toast.success('Expense logged successfully! 🎉');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to process expense. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/expenses', manualForm);
      setManualForm({ ...manualForm, amount: '', description: '', location: '', mood: 'Normal', date: format(new Date(), 'yyyy-MM-dd') });
      
      // Update local state immediately for better UX
      setExpenses([res.data, ...expenses]);
      
      toast.success('Expense logged successfully! 🎉');
      fetchData(); // Still refresh to update charts/insights
    } catch (error) {
      toast.error('Failed to log expense. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Expense deleted successfully');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const exportCSV = () => {
    const headers = ['Date,Category,Amount,Description'];
    const rows = expenses.map(e => `${format(new Date(e.date), 'yyyy-MM-dd')},${e.category},${e.amount},"${e.description || ''}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expenses_${format(new Date(), 'yyyy-MMM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare Chart Data safely
  const categoryData = (expenses || []).reduce((acc, curr) => {
    if (!curr || !curr.category || !curr.amount) return acc;
    const existing = acc.find(item => item.name === curr.category);
    if (existing) existing.value += parseFloat(curr.amount);
    else acc.push({ name: curr.category, value: parseFloat(curr.amount) });
    return acc;
  }, []);

  const trendData = (expenses || []).reduce((acc, curr) => {
    if (!curr || !curr.date || !curr.amount) return acc;
    const d = format(new Date(curr.date), 'MMM dd');
    const existing = acc.find(item => item.date === d);
    if (existing) existing.amount += parseFloat(curr.amount);
    else acc.push({ date: d, amount: parseFloat(curr.amount) });
    return acc;
  }, []).reverse(); 

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Gathering your financial universe...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Portfolio</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Asset Management & Analytics</p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md active:scale-95">
          <Download className="w-4 h-4 mr-2 text-emerald-500" />
          Export Statement
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Salary Input/Display */}
        <div className="glass-card p-6 premium-shadow bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-100/50 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110">
                <Coins size={24} />
              </div>
              {isEditingSalary ? (
                <button onClick={handleSalaryUpdate} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-600 hover:text-white transition-all">Save</button>
              ) : (
                <button onClick={() => setIsEditingSalary(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">Edit</button>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Salary</p>
            {isEditingSalary ? (
              <input 
                type="number" 
                value={salaryInput} 
                onChange={(e) => setSalaryInput(e.target.value)}
                className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-xl font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <h3 className="text-2xl font-black text-slate-900">₹{parseFloat(user?.monthly_salary || 0).toLocaleString()}</h3>
            )}
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/5 rotate-12" />
        </div>

        {/* Expenses Card */}
        <div className="glass-card p-6 premium-shadow relative overflow-hidden group">
          <div className="relative z-10">
            <div className="p-3 bg-red-100/50 rounded-2xl text-red-600 w-fit mb-4 group-hover:scale-110 transition-transform">
              <TrendingDown size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Burn</p>
            <h3 className="text-2xl font-black text-slate-900">₹{totalMonthlyExpenses.toLocaleString()}</h3>
            <p className="text-[10px] text-red-400 font-bold mt-2 flex items-center gap-1">
              <Clock size={12} /> Actual spending this month
            </p>
          </div>
        </div>

        {/* Subscriptions Card */}
        <div className="glass-card p-6 premium-shadow relative overflow-hidden group">
          <div className="relative z-10">
            <div className="p-3 bg-slate-100/50 rounded-2xl text-slate-600 w-fit mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recurring Costs</p>
            <h3 className="text-2xl font-black text-slate-900">₹{Math.round(totalMonthlySubscriptions).toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">Automated Commitments</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`glass-card p-6 premium-shadow relative overflow-hidden group border-2 ${remainingBalance < 0 ? 'border-red-200 bg-red-50/20' : 'border-emerald-200 bg-emerald-50/20'}`}>
          <div className="relative z-10">
            <div className={`p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform ${remainingBalance < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <Wallet size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Balance</p>
            <h3 className={`text-2xl font-black ${remainingBalance < 0 ? 'text-red-700' : 'text-emerald-700'}`}>₹{Math.round(remainingBalance).toLocaleString()}</h3>
            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${healthScore < 20 ? 'bg-red-500' : healthScore < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                 style={{ width: `${healthScore}%` }}
               ></div>
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-2">{healthScore.toFixed(0)}% of budget remaining</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {fraudAlert && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-5 flex items-start shadow-sm animate-in slide-in-from-left duration-500">
            <span className="text-2xl mr-4 flex-shrink-0">🚀</span>
            <div>
              <h3 className="text-red-800 font-bold text-sm uppercase tracking-wider mb-1">Anomaly Alert</h3>
              <p className="text-red-700 text-sm font-semibold">{fraudAlert}</p>
            </div>
          </div>
        )}

        {savingSuggestion && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-2xl p-5 flex items-start shadow-sm animate-in slide-in-from-left duration-700">
            <span className="text-2xl mr-4 flex-shrink-0">💎</span>
            <div>
              <h3 className="text-emerald-800 font-bold text-sm uppercase tracking-wider mb-1">Pro Tip</h3>
              <p className="text-emerald-700 text-sm font-semibold">{savingSuggestion}</p>
            </div>
          </div>
        )}

        {insight && (
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5 flex items-start shadow-sm">
            <Sparkles className="w-6 h-6 text-emerald-600 mt-0.5 mr-4 flex-shrink-0 animate-pulse" />
            <p className="text-emerald-900 text-sm font-bold leading-relaxed">{insight}</p>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AI Input Box */}
        <div className="glass-card p-6 premium-shadow">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            AI Assessment
          </h2>
          <form onSubmit={handleAiSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="e.g. 'Business meeting lunch ₹250'"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/50 backdrop-blur-sm transition-all text-sm font-medium"
                disabled={isAiLoading}
              />
              <button 
                type="button"
                onClick={startListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse scale-110' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                title={isListening ? "Stop Listening" : "Voice Audit"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
            <button 
              type="submit" 
              disabled={isAiLoading || !aiText}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              {isAiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <div className="flex items-center gap-2 mt-4">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Natural Language Processing Active</p>
          </div>
        </div>

        {/* Manual Input Box */}
        <div className="glass-card p-6 premium-shadow">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3">
               <Plus className="w-4 h-4 text-slate-600" />
            </div>
            Classic Entry
          </h2>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <input type="number" step="0.01" placeholder="Amount" required value={manualForm.amount} onChange={(e) => setManualForm({...manualForm, amount: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white/50" />
            </div>
            <div className="col-span-1">
              <select required value={manualForm.category} onChange={(e) => setManualForm({...manualForm, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white/50">
                <option value="" disabled>Select Category</option>
                <option value="Food">🍔 Food</option>
                <option value="Transport">🚗 Transport</option>
                <option value="Utilities">💡 Utilities</option>
                <option value="Entertainment">🎬 Entertainment</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <input type="date" required value={manualForm.date} onChange={(e) => setManualForm({...manualForm, date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white/50" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <select required value={manualForm.mood} onChange={(e) => setManualForm({...manualForm, mood: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white/50">
                <option value="Happy">🙂 I'm Happy</option>
                <option value="Normal">😐 Feeling Normal</option>
                <option value="Stress">😞 Stressed Out</option>
              </select>
            </div>
            <div className="col-span-2">
              <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 flex items-center justify-center transition-all shadow-xl active:scale-95 font-bold">
                <Plus className="w-5 h-5 mr-2" /> Log Expense
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Experimental/Advanced Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SubscriptionManager />
        <Gamification expenses={expenses} />
      </div>

       {/* Calendar Feature */}
       <div className="glass-card p-6 premium-shadow">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
            </div>
            Fiscal Calendar
          </h2>
          <ExpenseCalendar expenses={expenses} />
        </div>

      {/* Charts Section */}
      {expenses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 glass-card p-6 premium-shadow">
            <h3 className="text-xl font-bold mb-8 text-slate-800">Financial Trajectory</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => '₹' + val} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)'}} 
                  />
                  <Bar dataKey="amount" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="col-span-1 glass-card p-6 premium-shadow">
            <h3 className="text-xl font-bold mb-8 text-slate-800">Portfolio Mix</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {categoryData.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length]}}></span>
                  <span className="truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-16 border-dashed border-2 flex flex-col items-center justify-center text-slate-400">
          <Wallet className="w-16 h-16 text-slate-200 mb-4 animate-float" />
          <p className="font-bold text-lg">Your financial journey begins here.</p>
          <p className="text-sm">Log your first expense to unlock deep insights.</p>
        </div>
      )}

      {/* Recent Transactions List */}
      <div className="glass-card premium-shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Journal of Expenses</h3>
          <CalendarIcon className="w-4 h-4 text-slate-400" />
        </div>
        <ul className="divide-y divide-slate-100/50">
          {expenses.slice(0, 10).map((expense) => (
            <li key={expense.id} className="px-6 py-5 flex items-center justify-between hover:bg-white transition-all group">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                  {expense.category.charAt(0)}
                </div>
                <div className="ml-5">
                  <p className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">{expense.description || expense.category}</p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1 font-bold">
                    <span>{format(new Date(expense.date), 'MMMM dd, yyyy')}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                    <span className="text-emerald-400">{expense.category}</span>
                    {expense.location && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                        <span className="text-emerald-500">📍 {expense.location}</span>
                      </>
                    )}
                    {expense.mood && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                        <span>{expense.mood === 'Happy' ? '😊 lucide' : expense.mood === 'Stress' ? '😞' : '😐'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-lg font-black text-slate-900">₹{parseFloat(expense.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <button 
                  onClick={() => handleDelete(expense.id)}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default Dashboard;
