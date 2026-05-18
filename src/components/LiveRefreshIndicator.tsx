'use client';

import { useEffect, useState } from 'react';

export default function LiveRefreshIndicator() {
  const [refreshTime, setRefreshTime] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(prev => {
        if (prev <= 1) return 5;
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-normal ml-2" style={{ color: 'rgba(34,34,38,0.5)' }}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#374DF5' }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#374DF5' }} />
      </span>
      Auto-refresh: {refreshTime} min
    </span>
  );
}
