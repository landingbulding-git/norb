import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function HeaderClock() {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/40 py-1 px-3 rounded-full text-[10px] sm:text-xs font-mono text-zinc-400">
      <Clock className="w-3 h-3 text-orange-500 animate-pulse" />
      <span>UTC</span>
      <span className="text-zinc-500 font-medium">{timeStr || '12:00:00'}</span>
    </div>
  );
}
