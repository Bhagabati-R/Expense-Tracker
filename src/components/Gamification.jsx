import React, { useMemo } from 'react';
import { Trophy, Flame, Target, Star, Award, TrendingUp } from 'lucide-react';
import { format, differenceInDays, parseISO, isSameDay, subDays } from 'date-fns';

const Gamification = ({ expenses }) => {
  // Logic for tracking streaks - consecutive days with at least one expense
  const streak = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;

    // Get unique dates with expenses, sorted descending
    const dates = [...new Set(expenses.map(e => format(parseISO(e.date), 'yyyy-MM-dd')))]
      .sort((a, b) => new Date(b) - new Date(a));

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // If no expense today and no expense yesterday, streak is broken
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let currentStreak = 0;
    let checkDate = parseISO(dates[0]);

    for (let i = 0; i < dates.length; i++) {
        const expenseDate = parseISO(dates[i]);
        const diff = differenceInDays(checkDate, expenseDate);
        
        if (diff === 0) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
        } else if (diff === 1) {
            // Gap of 1 day is fine if we are iterating through dates
            currentStreak++;
            checkDate = subDays(expenseDate, 1);
        } else {
            break;
        }
    }

    return currentStreak;
  }, [expenses]);

  const totalSpent = useMemo(() => 
    expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  , [expenses]);

  const achievements = [
    { 
        title: 'Super Saver', 
        description: totalSpent > 5000 ? 'Saved over ₹5,000!' : `Keep going! Total: ₹${Math.round(totalSpent)}`, 
        icon: Trophy, 
        color: totalSpent > 5000 ? 'text-amber-500' : 'text-slate-400', 
        bg: totalSpent > 5000 ? 'bg-amber-100' : 'bg-slate-100',
        locked: totalSpent <= 5000
    },
    { 
        title: 'Data Ninja', 
        description: expenses.length >= 10 ? 'Logged 10+ expenses' : `${expenses.length}/10 entries`, 
        icon: Award, 
        color: expenses.length >= 10 ? 'text-emerald-500' : 'text-slate-400', 
        bg: expenses.length >= 10 ? 'bg-emerald-100' : 'bg-slate-100',
        locked: expenses.length < 10
    },
    { 
        title: 'Fire Starter', 
        description: streak >= 3 ? '3-day streak achieved!' : `${streak}/3 days streak`, 
        icon: Flame, 
        color: streak >= 3 ? 'text-orange-500' : 'text-slate-400', 
        bg: streak >= 3 ? 'bg-orange-100' : 'bg-slate-100',
        locked: streak < 3
    },
  ];

  return (
    <div className="glass-card p-6 premium-shadow">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <Star className="w-6 h-6 mr-2 text-emerald-500 fill-emerald-500" /> 
        Financial Performance
      </h2>

      <div className="space-y-4">
        {achievements.map((ach, i) => (
          <div key={i} className={`flex gap-4 items-center p-4 rounded-2xl border ${ach.locked ? 'border-dashed border-slate-200 opacity-60' : 'border-white bg-white/50'} transition-all hover:scale-[1.02]`}>
            <div className={`w-12 h-12 rounded-2xl ${ach.bg} ${ach.color} flex items-center justify-center shrink-0 shadow-sm`}>
              <ach.icon size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center">
                {ach.title}
                {ach.locked && <span className="ml-2 text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">Locked</span>}
              </h4>
              <p className="text-xs text-slate-500">{ach.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl text-white flex justify-between items-center relative overflow-hidden shadow-2xl shadow-emerald-200">
        <div className="relative z-10">
          <p className="text-xs text-emerald-100 font-bold uppercase tracking-widest mb-1 opacity-80">Operational Streak</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black">{streak}</p>
            <p className="text-lg font-bold">DAYS</p>
          </div>
          <p className="text-[10px] text-emerald-200 mt-2 font-medium">
            {streak > 0 ? 'Amazing consistency! Keep it up.' : 'Start logging today to begin your streak!'}
          </p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={120} />
        </div>
        <Flame size={60} className={`absolute -right-2 -bottom-2 transform rotate-12 z-0 ${streak > 0 ? 'text-orange-400 opacity-30 animate-pulse' : 'text-white/10'}`} />
      </div>
    </div>
  );
};

export default Gamification;
