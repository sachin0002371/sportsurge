'use client';

import { useState, useEffect } from 'react';

const TOURNAMENT_START = new Date("2026-06-11T17:00:00Z");

export default function WC2026Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = TOURNAMENT_START.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center mb-10">
      <div className="flex items-center gap-3 md:gap-6 bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl">
        {[
          { value: timeLeft.days, label: "Days", color: "from-amber-400 to-amber-600" },
          { value: timeLeft.hours, label: "Hours", color: "from-blue-400 to-blue-600" },
          { value: timeLeft.minutes, label: "Minutes", color: "from-purple-400 to-purple-600" },
          { value: timeLeft.seconds, label: "Seconds", color: "from-pink-400 to-pink-600" },
        ].map((item, idx) => (
          <div key={idx} className="text-center group">
            <div className={`bg-gradient-to-br ${item.color} rounded-xl md:rounded-2xl p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
              <div className="bg-[#16213e] rounded-[10px] md:rounded-[14px] px-4 md:px-6 py-3 md:py-4 min-w-[70px] md:min-w-[100px] flex items-center justify-center">
                <span className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="text-[11px] md:text-xs font-bold text-white/70 mt-2 uppercase tracking-widest">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
