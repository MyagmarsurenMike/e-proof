'use client';

import { useEffect, useRef, useState } from 'react';

export default function BackgroundGradientSnippet() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: -999, y: -999 });
  const [isInside, setIsInside] = useState(false);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const onEnter = () => setIsInside(true);
    const onLeave = () => setIsInside(false);

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden bg-white">
      {/* Base dot grid — fades downward */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(#bfdbfe 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage: 'radial-gradient(ellipse 100% 70% at 50% 0%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 70% at 50% 0%, #000 60%, transparent 100%)',
        }}
      />

      {/* Cursor spotlight — brighter dots follow mouse */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isInside ? 1 : 0,
          transition: 'opacity 0.3s',
          backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
          maskImage: `radial-gradient(circle 120px at ${cursor.x}px ${cursor.y}px, #000 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 120px at ${cursor.x}px ${cursor.y}px, #000 0%, transparent 100%)`,
        }}
      />

      {/* Soft glow under cursor */}
      <div
        className="absolute pointer-events-none"
        style={{
          opacity: isInside ? 0.1 : 0,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          left: cursor.x,
          top: cursor.y,
          transition: 'opacity 0.3s, left 0.06s, top 0.06s',
        }}
      />
    </div>
  );
}
