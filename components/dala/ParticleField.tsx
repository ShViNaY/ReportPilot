// components/dala/ParticleField.tsx
'use client';

import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  floatDuration: number;
  floatDelay: number;
  driftDuration: number;
  driftDelay: number;
  pulseDuration: number;
  pulseDelay: number;
  rotation: number;
}

interface ParticleFieldProps {
  count?: number;
  className?: string;
}

const PARTICLE_COLORS = ['#8052ff', '#ffb829', '#15846e'];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function ParticleField({ count = 28, className = '' }: ParticleFieldProps) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const s = (n: number) => seededRandom(i * 7 + n + 42);
      return {
        id: i,
        x: s(1) * 100,
        y: s(2) * 100,
        size: 6 + s(3) * 14,
        color: PARTICLE_COLORS[Math.floor(s(4) * PARTICLE_COLORS.length)],
        opacity: 0.06 + s(5) * 0.1,
        floatDuration: 6 + s(6) * 8,
        floatDelay: s(7) * -12,
        driftDuration: 20 + s(8) * 25,
        driftDelay: s(9) * -20,
        pulseDuration: 3 + s(10) * 5,
        pulseDelay: s(11) * -6,
        rotation: s(12) * 360,
      };
    });
  }, [count]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {particles.map((p) => {
          // Equilateral triangle points centered at origin
          const half = p.size / 2;
          const h = (p.size * Math.sqrt(3)) / 2;
          const points = `0,${-h / 2} ${half},${h / 2} ${-half},${h / 2}`;

          return (
            <g
              key={p.id}
              style={{
                ['--float-duration' as string]: `${p.floatDuration}s`,
                ['--float-delay' as string]: `${p.floatDelay}s`,
                ['--drift-duration' as string]: `${p.driftDuration}s`,
                ['--drift-delay' as string]: `${p.driftDelay}s`,
                ['--pulse-duration' as string]: `${p.pulseDuration}s`,
                ['--pulse-delay' as string]: `${p.pulseDelay}s`,
              }}
            >
              <polygon
                points={points}
                fill={p.color}
                opacity={p.opacity}
                transform={`translate(${(p.x / 100) * 1920}, ${(p.y / 100) * 1080}) rotate(${p.rotation})`}
                className="dala-animate-float dala-animate-pulse"
                style={{
                  transformOrigin: `${(p.x / 100) * 1920}px ${(p.y / 100) * 1080}px`,
                  animationDuration: `${p.floatDuration}s, ${p.pulseDuration}s`,
                  animationDelay: `${p.floatDelay}s, ${p.pulseDelay}s`,
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Additional point-lights / constellation dots */}
      {particles.slice(0, 12).map((p) => (
        <div
          key={`dot-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${2 + p.size * 0.15}px`,
            height: `${2 + p.size * 0.15}px`,
            backgroundColor: p.color,
            opacity: p.opacity * 1.5,
            animation: `dala-pulse-glow ${p.pulseDuration}s ease-in-out infinite`,
            animationDelay: `${p.pulseDelay}s`,
          }}
        />
      ))}
    </div>
  );
}
