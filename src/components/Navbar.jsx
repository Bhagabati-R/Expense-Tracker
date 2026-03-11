import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Wallet, User, Bell, BellOff, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
  }, [notificationsEnabled]);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <nav className="glass-card !rounded-none !border-0 !border-b border-slate-200/50 sticky top-0 z-50 backdrop-blur-xl bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <Link to="/" className="flex items-center group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
               <Wallet className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <span className="block text-xl font-black text-slate-900 tracking-tighter leading-none uppercase">Expense Tracker</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Personal Finance AI</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <div className="flex items-center bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <User size={18} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 leading-none">Global Partner</span>
                      <span className="text-sm font-bold text-slate-500">{user.name}</span>
                   </div>
                </div>

                <button 
                  onClick={toggleNotifications}
                  className={`p-2.5 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 ${
                    notificationsEnabled 
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                  title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
                >
                   {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white hover:shadow-xl hover:shadow-red-100 transition-all active:scale-95"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${location.pathname === '/login' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </Link>
                <Link 
                  to="/register" 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${location.pathname === '/register' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm'}`}
                >
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <User size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{user.name}</span>
                  <span className="text-[10px] font-bold text-slate-400">Global Partner</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-50 text-red-500 font-black text-sm uppercase tracking-widest"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-xl"
              >
                <LogIn size={18} />
                Sign In
              </Link>
              <Link 
                to="/register" 
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100"
              >
                <UserPlus size={18} />
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
