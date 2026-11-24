'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AdsterraBanner() {
  const pathname = usePathname();
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = bannerRef.current;
    if (!container) return;

    // Reset container on page navigation for a fresh ad impression
    container.innerHTML = '';

    const confScript = document.createElement('script');
    confScript.type = 'text/javascript';
    confScript.innerHTML = `
      atOptions = {
        'key' : 'b208dafda9744531f9a50267122412fd',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.setAttribute('data-cfasync', 'false');
    invokeScript.src = 'https://bicea.org/22/b208dafda9744531f9a50267122412fd';

    container.appendChild(confScript);
    container.appendChild(invokeScript);
  }, [pathname]);

  return (
    <div className="w-full flex justify-center items-center py-2 bg-transparent">
      <div
        ref={bannerRef}
        style={{
          width: '320px',
          minHeight: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
