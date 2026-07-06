import { Server, Monitor, Database } from 'lucide-react';

export default function TopologyMap({ isAlerting, alertSource, trafficData }) {
  const recentTraffic = trafficData?.slice(-10) || [];
  const activeBenignIps = recentTraffic
    .filter(t => t.status !== "DROP" && t.status !== "DDoS (DROP)")
    .map(t => t.src_ip);
    
  // This small snippet draws perfect T-shaped lines between the boxes!
  const renderBranch = () => (
    <>
      <div className="w-[2px] h-4 bg-slate-500"></div>
      <div className="flex w-[50%]">
         <div className="w-1/2 border-t-[2px] border-l-[2px] border-slate-500 h-6 rounded-tl-lg"></div>
         <div className="w-1/2 border-t-[2px] border-r-[2px] border-slate-500 h-6 rounded-tr-lg"></div>
      </div>
    </>
  );

  const renderHost = (ip) => {
    const isAttacker = isAlerting && alertSource === ip;
    const isBenignActive = activeBenignIps.includes(ip) && !isAttacker;
    
    let boxColor = 'border-zinc-500 bg-zinc-800';
    let iconColor = 'text-zinc-400';
    let textColor = 'text-zinc-400';
    let pulse = '';

    if (isAttacker) {
        boxColor = 'border-red-500 bg-red-500/20 shadow-[0_0_20px_-2px_rgba(239,68,68,0.8)] scale-125 z-20';
        iconColor = 'text-red-500';
        textColor = 'text-red-400 font-bold';
        pulse = 'animate-pulse';
    } else if (isBenignActive) {
        boxColor = 'border-neonBlue bg-neonBlue/10 shadow-[0_0_15px_-2px_rgba(11,244,243,0.5)] scale-110';
        iconColor = 'text-neonBlue';
        textColor = 'text-neonBlue font-bold';
        pulse = 'animate-pulse';
    }

    return (
      <div className="flex flex-col items-center">
          <div className={`p-1.5 rounded-full border-2 transition-all duration-300 ${boxColor} ${pulse}`}>
              <Monitor className={`w-4 h-4 ${iconColor}`} />
          </div>
          <span className={`text-[9px] font-mono mt-2 ${textColor}`}>{ip}</span>
      </div>
    );
  };

  const renderSwitch = (label) => (
     <div className="flex flex-col items-center z-10">
        <div className="p-2 bg-zinc-800 border-2 border-zinc-500 rounded shadow-lg">
            <Server className="w-5 h-5 text-zinc-200" />
        </div>
        <span className="text-[10px] font-mono mt-1 text-zinc-300">{label}</span>
     </div>
  );

  return (
    <div className="w-full h-full p-4 flex flex-col items-center justify-start overflow-auto min-w-[800px]">
      
      {/* OS-Ken */}
      <div className="flex flex-col items-center mb-2">
        <div className="w-14 h-14 rounded-full bg-neonBlue/20 border-2 border-neonBlue flex items-center justify-center animate-pulse shadow-[0_0_15px_-3px_rgba(11,244,243,0.5)] z-10">
           <Database className="w-7 h-7 text-neonBlue" />
        </div>
        {/* OS-Ken Label */}
        <span className="text-[10px] font-mono mt-2 text-neonBlue font-bold tracking-widest">OS-KEN</span>
      </div>

      {/* Tree Topology Start */}
      <div className="flex flex-col items-center w-full max-w-5xl">
         {renderSwitch('s1 (Root)')}
         {renderBranch()}
         
         {/* s2 and s3 Container */}
         <div className="flex w-full">
            {/* s2 Side */}
            <div className="flex flex-col items-center w-1/2">
               {renderSwitch('s2')}
               {renderBranch()}
               
               <div className="flex w-full">
                  {/* s4 */}
                  <div className="flex flex-col items-center w-1/2">
                     {renderSwitch('s4')}
                     {renderBranch()}
                     <div className="flex w-full">
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.1')}</div>
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.2')}</div>
                     </div>
                  </div>
                  {/* s5 */}
                  <div className="flex flex-col items-center w-1/2">
                     {renderSwitch('s5')}
                     {renderBranch()}
                     <div className="flex w-full">
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.3')}</div>
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.4')}</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* s3 Side */}
            <div className="flex flex-col items-center w-1/2">
               {renderSwitch('s3')}
               {renderBranch()}
               
               <div className="flex w-full">
                  {/* s6 */}
                  <div className="flex flex-col items-center w-1/2">
                     {renderSwitch('s6')}
                     {renderBranch()}
                     <div className="flex w-full">
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.5')}</div>
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.6')}</div>
                     </div>
                  </div>
                  {/* s7 */}
                  <div className="flex flex-col items-center w-1/2">
                     {renderSwitch('s7')}
                     {renderBranch()}
                     <div className="flex w-full">
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.7')}</div>
                        <div className="w-1/2 flex justify-center">{renderHost('10.0.0.8')}</div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
