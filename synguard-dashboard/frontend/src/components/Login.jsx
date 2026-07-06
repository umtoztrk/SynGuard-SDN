import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { io } from 'socket.io-client'; // 🟢 NEWLY ADDED

// 🟢 NEWLY ADDED: Defining the socket connection outside so it doesn't disconnect on page change
const socket = io('http://localhost:3001');

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' | 'user'
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Check if user is trying to login as admin but doesn't have admin role
        if (loginMode === 'admin' && data.role !== 'admin') {
          setError('This account does not have admin privileges.');
          return;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        
        localStorage.setItem('user_id', data.user_id);
        
        // 🚀 CRITICAL FIX: Changed to 'admin-active' to match the backend!
        socket.emit('admin-active', data.user_id);
        
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    }
  };

  const isAdmin = loginMode === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className={`relative z-10 w-full max-w-md p-8 bg-zinc-900/80 backdrop-blur-xl border rounded-2xl transition-all duration-500 ${
        isAdmin 
          ? 'border-purple-500/30 shadow-[0_0_40px_-5px_rgba(168,85,247,0.2)]' 
          : 'border-neonBlue/30 shadow-[0_0_40px_-5px_rgba(11,244,243,0.15)]'
      }`}>
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className={`p-3 rounded-full mb-4 border transition-all duration-500 ${
            isAdmin 
              ? 'bg-purple-500/10 border-purple-500/30' 
              : 'bg-neonBlue/10 border-neonBlue/30'
          }`}>
            {isAdmin 
              ? <ShieldCheck className="w-8 h-8 text-purple-400" />
              : <ShieldAlert className="w-8 h-8 text-neonBlue" />
            }
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-slate-100">
            SEC-OPS <span className={`transition-colors duration-500 ${isAdmin ? 'text-purple-400' : 'text-neonBlue'}`}>GATEWAY</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-2">SynGuard-SDN Authentication</p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1.5 bg-zinc-950 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => { setLoginMode('user'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
              !isAdmin
                ? 'bg-neonBlue/10 text-neonBlue border border-neonBlue/30 shadow-[0_0_15px_-3px_rgba(11,244,243,0.15)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="w-4 h-4" />
            User Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('admin'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
              isAdmin
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Login
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none transition-all placeholder:text-zinc-600 ${
                isAdmin 
                  ? 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                  : 'focus:border-neonBlue focus:ring-1 focus:ring-neonBlue'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none transition-all placeholder:text-zinc-600 ${
                isAdmin 
                  ? 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                  : 'focus:border-neonBlue focus:ring-1 focus:ring-neonBlue'
              }`}
            />
          </div>
          <button 
            type="submit"
            className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 mt-4 uppercase tracking-widest text-sm ${
              isAdmin
                ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]'
                : 'bg-neonBlue/10 hover:bg-neonBlue/20 text-neonBlue border border-neonBlue/50 hover:shadow-[0_0_20px_-5px_#0bf4f3]'
            }`}
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
