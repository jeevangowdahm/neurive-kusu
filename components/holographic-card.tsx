'use client';

import { useRef, useState } from 'react';

/**
 * Holographic Card
 * Card with 3D tilt effect and holographic shine on hover
 */
export function HolographicCard({
  children,
  className = '',
  shineColor = 'rgba(59, 130, 246, 0.08)',
}: {
  children: React.ReactNode;
  className?: string;
  shineColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [shine, setShine] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setShine({ x, y, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setShine({ x: 0, y: 0, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden transition-transform duration-200 ease-out ${className}`}
      style={{ transform, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Holographic shine overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          opacity: shine.opacity,
          background: `radial-gradient(circle at ${shine.x}px ${shine.y}px, ${shineColor}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}
