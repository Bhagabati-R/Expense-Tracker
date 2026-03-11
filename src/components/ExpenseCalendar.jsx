import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

const ExpenseCalendar = ({ expenses }) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group expenses by date
  const expensesByDate = expenses.reduce((acc, exp) => {
    const d = format(new Date(exp.date), 'yyyy-MM-dd');
    acc[d] = (acc[d] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});

  // Calculate daily average to determine color coding
  const totalSpent = Object.values(expensesByDate).reduce((sum, val) => sum + val, 0);
  const daysWithExpenses = Object.keys(expensesByDate).length;
  const avgDaily = daysWithExpenses > 0 ? totalSpent / daysWithExpenses : 0;

  const getColor = (amount) => {
    if (!amount || amount === 0) return 'bg-slate-50'; // No spending
    if (amount <= avgDaily * 0.5) return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Low
    if (amount <= avgDaily * 1.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Medium
    return 'bg-red-100 text-red-800 border-red-200'; // High
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center text-emerald-600">
          <CalendarIcon className="w-5 h-5 mr-2" />
          Fiscal Asset Calendar
        </h3>
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center"><div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200 mr-1"></div> Low</span>
          <span className="flex items-center"><div className="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-200 mr-1"></div> Med</span>
          <span className="flex items-center"><div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 mr-1"></div> High</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-400 py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}

        {/* Padding for first day of month */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-transparent rounded-lg p-2 h-16"></div>
        ))}

        {daysInMonth.map((day, i) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const spent = expensesByDate[formattedDate] || 0;
          const isToday = isSameDay(day, today);

          return (
            <div 
              key={i} 
              className={`rounded-lg p-2 h-16 border flex flex-col justify-between transition-all hover:shadow-md ${getColor(spent)} ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
            >
              <span className={`text-xs font-bold ${spent === 0 ? 'text-slate-400' : ''}`}>
                {format(day, 'd')}
              </span>
              {spent > 0 && (
                <span className="text-[10px] font-bold sm:text-xs">
                  ₹{Math.round(spent)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpenseCalendar;
