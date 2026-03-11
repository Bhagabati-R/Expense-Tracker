import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, Plus, Trash2, AlertCircle, Zap, ShieldCheck } from 'lucide-react';

const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [detected, setDetected] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', billing_cycle: 'monthly' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, detectRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/subscriptions/detect')
      ]);
      setSubscriptions(subRes.data || []);
      setDetected(detectRes.data || []);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions', form);
      setForm({ name: '', amount: '', billing_cycle: 'monthly' });
      fetchData();
    } catch (error) {
      // Silent fail
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/subscriptions/${id}`);
      fetchData();
    } catch (error) {
      // Silent fail
    }
  };

  const totalMonthly = subscriptions.reduce((sum, s) => {
    return sum + (s.billing_cycle === 'monthly' ? parseFloat(s.amount) : parseFloat(s.amount) / 12);
  }, 0);

  if (loading) return <div className="animate-pulse glass-card p-6 h-48"></div>;

  return (
    <div className="glass-card p-6 premium-shadow">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <CreditCard className="w-6 h-6 mr-2 text-emerald-500" /> 
        Corporate Subscriptions
      </h2>

      {/* Monthly/Yearly Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center">
          <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-1 opacity-70">Operating Expense</p>
          <p className="text-2xl font-black text-emerald-700">₹{Math.round(totalMonthly).toLocaleString()}</p>
        </div>
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 opacity-70">Projected Yearly</p>
          <p className="text-2xl font-black text-slate-700">₹{Math.round(totalMonthly * 12).toLocaleString()}</p>
        </div>
      </div>

      {/* Suggested Subscriptions */}
      {detected.length > 0 && (
        <div className="mb-8 p-5 bg-amber-50/50 rounded-2xl border border-amber-100 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-black text-amber-800 flex items-center mb-1 uppercase tracking-wider">
              <Zap className="w-4 h-4 mr-2 text-amber-500 fill-amber-500" /> 
              Potential Subscriptions
            </h3>
            <p className="text-xs text-amber-600 mb-4 font-bold">We detected recurring payments. Convert them?</p>
            <div className="space-y-2">
              {detected.slice(0, 2).map((d, i) => (
                <div key={i} className="flex justify-between items-center text-sm bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-200 shadow-sm hover:scale-[1.02] transition-transform">
                  <span className="font-bold text-slate-700">{d.description || d.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-900">₹{parseFloat(d.amount)}</span>
                    <button 
                      onClick={() => {
                        setForm({ name: d.description || d.category, amount: d.amount, billing_cycle: 'monthly' });
                      }}
                      className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-500/10 rotate-12" />
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input 
              type="text" 
              placeholder="e.g. Netflix" 
              required 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input 
              type="number" 
              placeholder="Amount" 
              required 
              value={form.amount} 
              onChange={e => setForm({...form, amount: e.target.value})}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <select 
                value={form.billing_cycle} 
                onChange={e => setForm({...form, billing_cycle: e.target.value})}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
        </div>
        <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center justify-center text-sm font-black transition-all shadow-xl shadow-emerald-100 active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Authorize Subscription
        </button>
      </form>

      {/* Subs List */}
      <div className="space-y-3">
        {subscriptions.map(sub => (
          <div key={sub.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 bg-white/50 hover:bg-white transition-all group">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <CreditCard size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-slate-800 text-sm">{sub.name}</h4>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{sub.billing_cycle}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-emerald-600 text-base">₹{parseFloat(sub.amount).toLocaleString()}</span>
              <button 
                onClick={() => handleDelete(sub.id)}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionManager;
