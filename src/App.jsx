import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import ChatAssistant from './components/ChatAssistant';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <>
                      <Dashboard />
                      <ChatAssistant />
                    </>
                  </ProtectedRoute>
                } />
              </Routes>
            </ErrorBoundary>
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
