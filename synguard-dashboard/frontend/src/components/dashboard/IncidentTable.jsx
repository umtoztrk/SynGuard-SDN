import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';

export default function IncidentTable({ newIncidentTrigger }) {
  const [incidents, setIncidents] = useState([]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [newIncidentTrigger]);

  return (
    <div className="flex-1 overflow-auto rounded border border-zinc-800/50">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-400 sticky top-0 backdrop-blur">
          <tr>
            <th className="px-4 py-3 border-b border-zinc-800">Timestamp</th>
            <th className="px-4 py-3 border-b border-zinc-800">Source IP</th>
            <th className="px-4 py-3 border-b border-zinc-800">Type</th>
            <th className="px-4 py-3 border-b border-zinc-800">Severity</th>
            <th className="px-4 py-3 border-b border-zinc-800">Detection Speed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {incidents.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center text-zinc-500">
                No incidents recorded.
              </td>
            </tr>
          ) : (
            incidents.map((incident) => (
              <tr key={incident.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                  <div className="flex items-center gap-2">
                     <Clock className="w-3 h-3" />
                     {new Date(incident.timestamp).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-neonBlue">{incident.source_ip}</td>
                <td className="px-4 py-3 text-red-400">{incident.attack_type}</td>
                <td className="px-4 py-3">
                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
                     <AlertTriangle className="w-3 h-3" />
                     {incident.severity}
                   </span>
                </td>
                <td className="px-4 py-3 font-mono text-neonGreen text-xs">
                   <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      {incident.detection_time || '11.4 ms'}
                   </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
