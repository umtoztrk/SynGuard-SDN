import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, PauseCircle, PlayCircle } from 'lucide-react';

export default function LiveTerminal({ events }) {
  const terminalRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Smart system that disables Auto-Scroll when the user scrolls up
  const handleScroll = () => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  // Scroll to the bottom on new data only if Auto-Scroll is enabled
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-zinc-800 font-mono text-xs overflow-hidden relative shadow-lg">
      
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between z-10">
         <div className="flex items-center gap-2 text-zinc-400">
            <TerminalIcon className="w-4 h-4"/>
            <span>OS-KEN [Packet-In / Event Log]</span>
         </div>
         <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold transition-colors border ${
                autoScroll 
                ? 'text-neonBlue bg-neonBlue/10 border-neonBlue/30' 
                : 'text-zinc-400 bg-zinc-800 border-zinc-600 hover:text-white'
            }`}
         >
            {autoScroll ? <><PlayCircle className="w-3 h-3"/> Tracking</> : <><PauseCircle className="w-3 h-3"/> Paused</>}
         </button>
      </div>

      <div
        ref={terminalRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 text-zinc-300"
      >
        {events.length === 0 ? (
          <div className="text-zinc-600 italic">System listening, waiting for traffic...</div>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="whitespace-pre-wrap break-all hover:bg-zinc-900/80 px-1 rounded border-l-2 border-transparent hover:border-zinc-500">
              {ev.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
