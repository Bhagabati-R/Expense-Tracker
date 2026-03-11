import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react';

const GoalsManager = () => {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goals');
      setGoals(res.data || []);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goals', form);
      setForm({ name: '', target_amount: '', deadline: '' });
      fetchGoals();
    } catch (error) {
      // Silent fail
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      // Silent fail
    }
  };

  const calculateMonthsToGoal = (deadline) => {
    const today = new Date();
    const targetDate = new Date(deadline);
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    return months > 0 ? months : 1;
  };

  if (loading) return <div className="animate-pulse bg-white p-6 rounded-xl h-48 border border-slate-200"></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center text-emerald-600">
        <Target className="w-5 h-5 mr-2" /> Strategic Fiscal Goals
      </h2>

      {/* Add Goal Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input 
          type="text" 
          placeholder="Goal (e.g. Buy Laptop)" 
          required 
          value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})}
          className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm"
        />
        <input 
          type="number" 
          placeholder="Amount (₹)" 
          required 
          value={form.target_amount} 
          onChange={e => setForm({...form, target_amount: e.target.value})}
          className="w-full sm:w-32 px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm"
        />
        <input 
          type="date" 
          required 
          value={form.deadline} 
          onChange={e => setForm({...form, deadline: e.target.value})}
          className="w-full sm:w-40 px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm"
        />
        <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm text-sm font-medium">
          <Plus className="w-4 h-4 mr-1" /> Add
        </button>
      </form>

      {/* Goals List */}
      {goals.length === 0 ? (
        <p className="text-sm text-center text-slate-500 py-4">No goals configured yet. Set one to start saving!</p>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const monthsRemaining = calculateMonthsToGoal(goal.deadline);
            const monthlySavingReq = parseFloat(goal.target_amount) / monthsRemaining;

            return (
              <div key={goal.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50 relative group">
                <button 
                  onClick={() => handleDelete(goal.id)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-base">{goal.name}</h4>
                  <span className="font-bold text-emerald-600">₹{parseFloat(goal.target_amount).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center text-sm text-slate-600 bg-white p-2 rounded-md border border-slate-200 mt-3 inline-flex">
                  <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
                  Save <span className="font-bold text-slate-800 mx-1">₹{Math.round(monthlySavingReq).toLocaleString()}</span> / mo to reach goal by <span className="font-bold text-slate-800 ml-1">{new Date(goal.deadline).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalsManager;
