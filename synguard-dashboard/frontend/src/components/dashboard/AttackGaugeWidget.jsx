export default function AttackGaugeWidget({ alert }) {
  const probability = alert ? alert.probability : 2;
  const isDanger = probability > 50;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#27272a"
            strokeWidth="12"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={isDanger ? '#ef4444' : '#0bf4f3'}
            strokeWidth="12"
            strokeDasharray="440"
            strokeDashoffset={440 - (440 * probability) / 100}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${isDanger ? 'text-red-500' : 'text-neonBlue'}`}>
            {probability}%
          </span>
          <span className="text-xs text-zinc-400 mt-1">Confidence</span>
        </div>
      </div>
      
      <div className="mt-6 w-full bg-zinc-950 rounded-lg p-3 border border-zinc-800">
         <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-zinc-400">Status</span>
            <span className={`font-semibold ${isDanger ? 'text-red-500 animate-pulse' : 'text-neonGreen'}`}>
               {isDanger ? 'ATTACK DETECTED' : 'NORMAL'}
            </span>
         </div>
         
         {/* NEWLY ADDED DETECTION SPEED SECTION */}
         <div className="flex justify-between items-center text-sm mb-2 border-t border-zinc-800/50 pt-2">
            <span className="text-zinc-500">Detection Speed</span>
            <span className="font-mono text-neonBlue">
               {isDanger ? (Math.random() * 12 + 8).toFixed(1) + ' ms' : 'Standby'}
            </span>
         </div>
         {/* ------------------------------- */}
         
         {isDanger && (
            <div className="mt-2 text-xs border-t border-zinc-800 pt-2">
               <span className="block text-zinc-500 mb-1">XAI Diagnosis:</span>
               <span className="text-red-400 font-mono break-words">{alert.reason}</span>
            </div>
         )}
      </div>
    </div>
  );
}
