'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date | string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) {
    return <span className="text-sm font-medium" style={{ color: '#374DF5' }}>Match started!</span>;
  }

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hrs' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-1">
          <div className="rounded-lg px-2 py-1 min-w-[40px] text-center" style={{ backgroundColor: 'rgba(229,233,239,0.5)' }}>
            <span className="text-lg tabular-nums" style={{ fontWeight: 700, color: '#222226' }}>
              {String(unit.value).padStart(2, '0')}
            </span>
            <p className="text-[9px] font-medium" style={{ color: '#374DF5' }}>{unit.label}</p>
          </div>
          {index < units.length - 1 && (
            <span className="font-bold" style={{ color: 'rgba(34,34,38,0.4)' }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}
