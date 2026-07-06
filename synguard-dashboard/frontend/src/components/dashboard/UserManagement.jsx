import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, ShieldCheck, User as UserIcon, AlertCircle, CheckCircle2, Key, X } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  
  // States for Adding New User
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  
  // States for Changing Password
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pwdData, setPwdData] = useState({ username: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const [feedback, setFeedback] = useState(null);

  // GETTING THE LOGGED-IN USER'S INFO (If not in localStorage, assume admin)
  const token = localStorage.getItem('token');
  const currentUserRole = localStorage.getItem('role') || 'admin';
  const currentUsername = localStorage.getItem('username') || '';

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- ADD USER (Admin Only) ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setFeedback({ type: 'error', message: 'Username and password are required.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username: username.trim(), password, role })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: `User "${data.username}" added successfully.` });
        setUsername('');
        setPassword('');
        setRole('user');
        fetchUsers();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Could not add user.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE USER (Admin Only) ---
  const handleDeleteUser = async (id, uname) => {
    if (!window.confirm(`Are you sure you want to delete the user "${uname}"?`)) return;
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message || `"${uname}" has been deleted.` });
        fetchUsers();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Could not delete.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not connect to the server.' });
    }
  };

  // --- OPEN PASSWORD MODAL ---
  const openPasswordModal = (uname) => {
    setPwdData({ username: uname, oldPassword: '', newPassword: '', confirmPassword: '' });
    setIsModalOpen(true);
  };

  // --- CHANGE PASSWORD PROCESS ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdData.oldPassword || !pwdData.newPassword) {
      setFeedback({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match!' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          username: pwdData.username,
          oldPassword: pwdData.oldPassword,
          newPassword: pwdData.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message || 'Password successfully changed!' });
        setIsModalOpen(false);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Could not change password.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not connect to the server.' });
    } finally {
      setPwdLoading(false);
    }
  };

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Users to display in the table: Normal user sees only themselves, Admin sees everyone.
  const displayedUsers = currentUserRole === 'admin' 
    ? users 
    : users.filter(user => user.username === currentUsername);

  return (
    <div className="h-full flex flex-col gap-6 relative">
      
      {/* TOP BAR */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-wide">
          {currentUserRole === 'admin' ? 'User Management' : 'My Profile & Security'}
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          {currentUserRole === 'admin' 
            ? 'Manage system access and security settings.' 
            : 'Manage your account settings and password.'}
        </p>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-300 animate-pulse-once ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        
        {/* NEW USER FORM (ONLY ADMIN CAN SEE) */}
        {currentUserRole === 'admin' && (
          <div className="col-span-12 lg:col-span-5 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-neonBlue/10 rounded-lg border border-neonBlue/20">
                <UserPlus className="w-5 h-5 text-neonBlue" />
              </div>
              <h3 className="font-semibold tracking-wide text-lg">Add New User</h3>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Role</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRole('user')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all duration-200 ${role === 'user' ? 'bg-neonBlue/10 border-neonBlue/40 text-neonBlue' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                    <UserIcon className="w-4 h-4" /> User
                  </button>
                  <button type="button" onClick={() => setRole('admin')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all duration-200 ${role === 'admin' ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-neonBlue/10 hover:bg-neonBlue/20 text-neonBlue border border-neonBlue/50 font-bold py-3 px-4 rounded-lg mt-2 uppercase tracking-widest text-sm disabled:opacity-50">
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>
        )}

        {/* USERS TABLE (Expands to full width if normal user) */}
        <div className={`col-span-12 ${currentUserRole === 'admin' ? 'lg:col-span-7' : 'lg:col-span-12 max-w-4xl'} bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-lg flex flex-col`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold tracking-wide text-lg">
              {currentUserRole === 'admin' ? 'Registered Users' : 'My Account Details'}
            </h3>
          </div>

          <div className="flex-1 overflow-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">ID</th>
                  <th className="text-left px-5 py-3 font-semibold">Username</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-right px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {displayedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-5 py-3.5 font-mono text-zinc-500">{user.id}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-200">{user.username}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-neonBlue/10 text-neonBlue border border-neonBlue/25'}`}>
                        {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    
                    {/* NEW ACTION COLUMN */}
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {/* Change Password Button (Key Icon) - Visible to everyone */}
                      <button
                        onClick={() => openPasswordModal(user.username)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all border border-transparent hover:border-amber-500/20"
                        title="Change Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {/* Delete Button (Only Admin Can See) */}
                      {currentUserRole === 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Key className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Username</label>
                {/* NAME FIELD IS NOW LOCKED (Read-Only) */}
                <input
                  type="text"
                  value={pwdData.username}
                  readOnly
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={pwdData.oldPassword}
                  onChange={e => setPwdData({...pwdData, oldPassword: e.target.value})}
                  placeholder="Enter current password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  type="password"
                  value={pwdData.newPassword}
                  onChange={e => setPwdData({...pwdData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={pwdData.confirmPassword}
                  onChange={e => setPwdData({...pwdData, confirmPassword: e.target.value})}
                  placeholder="Re-enter new password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all text-sm"
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 py-3 px-4 rounded-lg bg-amber-500/10 border border-amber-500/50 hover:bg-amber-500/20 text-amber-500 hover:shadow-[0_0_15px_-3px_#f59e0b] font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {pwdLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
