import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  id: string;
  height: number;
  width: number;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ id, height, width, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any previous ad content
    containerRef.current.innerHTML = '';
    
    // Create atOptions config script
    const scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.text = `
      atOptions = {
        'key' : '${id}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;
    
    // Create script tag to invoke the ad loader
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `https://www.highperformanceformat.com/${id}/invoke.js`;
    
    containerRef.current.appendChild(scriptEl);
    containerRef.current.appendChild(invokeScript);
  }, [id, height, width]);

  return (
    <div className={`flex flex-col items-center justify-center my-6 ${className}`}>
      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-600 mb-1.5 select-none">
        Advertisement
      </span>
      <div 
        ref={containerRef} 
        style={{ width: `${width}px`, height: `${height}px` }} 
        className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-xs flex items-center justify-center"
      />
    </div>
  );
};

export default AdBanner;
