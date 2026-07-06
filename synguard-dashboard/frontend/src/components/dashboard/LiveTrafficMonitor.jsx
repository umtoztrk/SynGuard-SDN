import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function LiveTrafficMonitor({ data, isAlerting }) {
  const color = isAlerting ? '#ef4444' : '#0bf4f3';
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis 
            dataKey="timestamp" 
            tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} 
            stroke="#52525b" 
            fontSize={12} 
            tickMargin={10} 
        />
        <YAxis stroke="#52525b" fontSize={12} tickFormatter={(tick) => `${tick}`} />
        <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
            itemStyle={{ color: '#e4e4e7' }}
            labelFormatter={(label) => new Date(label).toLocaleTimeString()}
        />
        <Area 
            type="monotone" 
            dataKey="packetFlow" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorFlow)" 
            isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
