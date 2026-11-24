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
  // Disabled to enforce strictly 1 single 320x50 banner per page as required by Adsterra for optimal CPM
  return null;
}

