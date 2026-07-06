import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { LogOut, Activity, Network, Shield, Bell, Settings, User, LayoutDashboard, Terminal as TerminalIcon, AlertTriangle, UserPlus } from 'lucide-react';
import LiveTrafficMonitor from './dashboard/LiveTrafficMonitor';
import TopologyMap from './dashboard/TopologyMap';
import AttackGaugeWidget from './dashboard/AttackGaugeWidget';
import IncidentTable from './dashboard/IncidentTable';
import LiveTerminal from './dashboard/LiveTerminal';
import UserManagement from './dashboard/UserManagement';

export default function Dashboard() {
  const [socket, setSocket] = useState(null);
  const [trafficData, setTrafficData] = useState([]);
  const [xaiAlert, setXaiAlert] = useState(null);
  const [terminalEvents, setTerminalEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role') || 'user';
  const currentUsername = localStorage.getItem('username') || 'User';

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('traffic-update', (data) => {
      setTrafficData(prev => {
        const newData = [...prev, data];
        if (newData.length > 200) newData.shift();
        return newData;
      });
    });

    newSocket.on('xai-alert', (data) => {
      // If the backend sent empty data (null) or the threat returned to NORMAL, turn off the alarm (Return to Blue)
      if (!data || data.threat_level === "NORMAL") {
        setXaiAlert(null); 
      } else {
        setXaiAlert(data); // If there is an attack, trigger the Red alarm
      }
    });

    newSocket.on('terminal-event', (event) => {
      setTerminalEvents(prev => [...prev, { id: Date.now() + Math.random(), text: event }]);
    });

    return () => newSocket.close();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const isAlerting = !!xaiAlert;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-12 lg:col-span-8 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 shadow-lg min-h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-neonBlue" />
                <h2 className="font-semibold tracking-wide">Live Traffic Monitor</h2>
              </div>
              <div className="flex-1 min-h-0">
                <LiveTrafficMonitor data={trafficData} isAlerting={isAlerting} />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 shadow-lg">
              <h2 className="font-semibold tracking-wide mb-4">Attack Probability</h2>
              <AttackGaugeWidget alert={xaiAlert} />
            </div>
          </div>
        );
      case 'topology':
        return (
          <div className="h-full w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col shadow-lg">
             <div className="flex items-center gap-2 mb-4">
              <Network className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold tracking-wide">SDN Topology Map</h2>
            </div>
            <div className="flex-1 relative bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
               <TopologyMap isAlerting={isAlerting} alertSource={xaiAlert?.attacker_ip} trafficData={trafficData} />
            </div>
          </div>
        );
      case 'incidents':
        return (
          <div className="h-full w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col shadow-lg">
             <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold tracking-wide">Incident Archive</h2>
            </div>
            <div className="flex-1 w-full min-h-0 flex flex-col">
               <IncidentTable newIncidentTrigger={xaiAlert} />
            </div>
          </div>
        );
      case 'terminal':
        return (
          <div className="h-full w-full bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
              <LiveTerminal events={terminalEvents} />
          </div>
        );
      case 'users':
        return <UserManagement />;
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'topology', label: 'Topology Map', icon: <Network className="w-5 h-5" /> },
    { id: 'incidents', label: 'Incident Logs', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'terminal', label: 'OS-Ken Terminal', icon: <TerminalIcon className="w-5 h-5" /> },
  ];

  // 🚀 HERE IS THE MAGIC TOUCH!
  if (userRole === 'admin') {
    // If admin, add User Management to the menu
    navItems.push({ id: 'users', label: 'User Management', icon: <UserPlus className="w-5 h-5" /> });
  } else {
    // If normal user, add Profile to the menu
    navItems.push({ id: 'users', label: 'My Profile', icon: <User className="w-5 h-5" /> });
  }

  // For the header, find the current tab info
  const currentNavItem = navItems.find(i => i.id === activeTab);

  return (
    <div className={`min-h-screen ${isAlerting ? 'bg-red-950/20' : 'bg-zinc-950'} text-slate-100 flex transition-colors duration-500 relative overflow-hidden`}>
      {/* Red flash overlay if alerting */}
      {isAlerting && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none z-0"></div>
      )}

      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-800 bg-zinc-900/80 backdrop-blur-xl flex flex-col relative z-20 shadow-2xl">
        <div className="h-20 flex items-center px-6 border-b border-zinc-800">
          <Shield className={`w-8 h-8 mr-3 border-2 rounded-full p-1 ${isAlerting ? 'text-red-500 border-red-500 animate-pulse shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]' : 'text-neonBlue border-neonBlue shadow-[0_0_15px_-3px_rgba(11,244,243,0.3)]'}`} />
          <h1 className="text-xl font-bold tracking-widest leading-tight">
            SYN-GUARD <br/><span className={isAlerting ? 'text-red-500' : 'text-neonBlue'}>DASH</span>
          </h1>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${
                activeTab === item.id 
                  ? item.id === 'users' && userRole === 'admin'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)] font-semibold'
                    : 'bg-neonBlue/10 text-neonBlue border border-neonBlue/30 shadow-[0_0_15px_-3px_rgba(11,244,243,0.2)] font-semibold'
                  : 'text-zinc-400 hover:text-slate-200 hover:bg-zinc-800/50 font-medium'
              }`}
            >
              <div className={activeTab === item.id ? 'animate-pulse' : ''}>{item.icon}</div>
              <span className="tracking-wide text-[15px]">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950/30">
          <div className="flex items-center gap-3 px-2 py-2 mb-4">
             <span className="w-2.5 h-2.5 rounded-full bg-neonGreen animate-pulse shadow-[0_0_8px_rgba(57,255,20,0.8)]"></span>
             <span className="text-sm font-mono text-zinc-400">System Online</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-zinc-800 hover:border-red-500/20 font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 w-0 h-screen">
        {/* Top Navbar */}
        <header className="h-20 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-8 flex items-center justify-between shadow-sm">
           <h2 className="text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-3 drop-shadow-md">
             {currentNavItem?.icon}
             {currentNavItem?.label}
           </h2>
           
           <div className="flex items-center gap-6">
             <button className="relative text-zinc-400 hover:text-slate-100 transition-colors hover:scale-110 transform duration-200">
               <Bell className="w-6 h-6" />
               {isAlerting && (
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900 animate-ping"></span>
               )}
                {isAlerting ? (
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900"></span>
               ) : (
                 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neonBlue rounded-full border-2 border-zinc-900"></span>
               )}
             </button>
             <button className="text-zinc-400 hover:text-slate-100 transition-colors hover:rotate-90 transform duration-300">
               <Settings className="w-6 h-6" />
             </button>
             <div className="w-px h-8 bg-zinc-700/50 mx-2"></div>
             <button className="flex items-center gap-3 text-zinc-300 hover:text-slate-100 transition-colors group">
               <div className="text-right">
                  <div className="text-sm font-bold text-slate-200 group-hover:text-neonBlue transition-colors">{currentUsername}</div>
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                    {userRole === 'admin' ? 'Root Sec-Ops' : 'Operator'}
                  </div>
               </div>
               <div className={`w-10 h-10 rounded-full bg-zinc-800 border-2 flex items-center justify-center transition-colors shadow-lg shadow-zinc-900/50 ${
                 userRole === 'admin' ? 'border-purple-500/50 group-hover:border-purple-400' : 'border-zinc-700 group-hover:border-neonBlue'
               }`}>
                 <User className={`w-5 h-5 transition-colors ${
                   userRole === 'admin' ? 'text-purple-400 group-hover:text-purple-300' : 'text-zinc-400 group-hover:text-neonBlue'
                 }`} />
               </div>
             </button>
           </div>
        </header>

        {/* Dynamic Content rendered here */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-zinc-950/50">
           {renderContent()}
        </main>
      </div>
    </div>
  );
}
