'use client';

import React, { useEffect } from 'react';

interface AdPlacementProps {
  type?: 'sidebar' | 'horizontal';
  className?: string;
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'vertical';
}

// Map of slot IDs to ensure valid fallback and easy recognition
const AD_SLOTS: Record<string, string> = {
  '1991768591': '1991768591', // Humanize Header
  '4074188210': '4074188210', // Humanize 2
  '2921706886': '2921706886', // Humanize 3
  '3430330070': '3430330070', // Humanize 4
  '2280899939': '2280899939', // Humanize Side Left
  // Fallbacks if old slot names are passed
  'top-leaderboard-ad': '1991768591',
  'middle-bumper-ad': '4074188210',
  'lower-banner-ad': '3430330070',
  'sidebar-top-ad': '2280899939',
  'sidebar-bottom-ad': '2921706886',
};

export default function AdPlacement({ type = 'horizontal', className = '', slotId = '1991768591', format = 'auto' }: AdPlacementProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  const actualSlot = AD_SLOTS[slotId] || slotId;

  // Determine styles and attributes based on format
  const adStyle: React.CSSProperties = format === 'rectangle'
    ? { display: 'inline-block', width: '250px', height: '250px' }
    : format === 'vertical'
    ? { display: 'block', width: '100%', minHeight: '600px' }
    : { display: 'block', width: '100%' };

  return (
    <div className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm group hover:border-indigo-300 transition-all duration-300 ${className}`}>
      <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase block mb-2 text-center w-full border-b border-slate-100 pb-1">
        ADVERTISEMENT - SPONSORED
      </span>
      <div className="w-full flex justify-center items-center min-h-[90px]">
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client="ca-pub-9074769053982810"
          data-ad-slot={actualSlot}
          data-ad-format={format}
          data-full-width-responsive={format === 'rectangle' ? 'false' : 'true'}
        />
      </div>
    </div>
  );
}

