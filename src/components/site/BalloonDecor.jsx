import React from 'react';

const balloonColors = [
  'bg-pink-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400',
  'bg-purple-400', 'bg-orange-400', 'bg-red-400', 'bg-teal-400',
  'bg-pink-300', 'bg-indigo-400', 'bg-amber-400', 'bg-cyan-400',
];

function Balloon({ color, size, style, delay, className = '' }) {
  return (
    <div
      className={`absolute rounded-full ${color} opacity-60 ${className}`}
      style={{
        width: size,
        height: size * 1.2,
        borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
        animationDelay: `${delay}s`,
        ...style,
      }}
    >
      <div
        className="absolute left-1/2 -bottom-4 w-px bg-gray-300"
        style={{ height: size * 0.5, transform: 'translateX(-50%)' }}
      />
      <div
        className="absolute top-2 left-3 w-2 h-3 bg-white/40 rounded-full"
        style={{ width: size * 0.15, height: size * 0.2 }}
      />
    </div>
  );
}

export default function BalloonDecor({ count = 8, className = '' }) {
  const balloons = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      color: balloonColors[i % balloonColors.length],
      size: 30 + Math.random() * 40,
      left: `${(i / count) * 100 + (Math.random() * 10 - 5)}%`,
      top: `${Math.random() * 80}%`,
      delay: Math.random() * 4,
      float: Math.random() > 0.5,
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {balloons.map((b, i) => (
        <Balloon
          key={i}
          color={b.color}
          size={b.size}
          delay={b.delay}
          className={b.float ? 'animate-balloon-float' : 'animate-balloon-float-slow'}
          style={{ left: b.left, top: b.top }}
        />
      ))}
    </div>
  );
}

export function BalloonDivider() {
  return (
    <div className="flex justify-center items-center gap-2 py-8">
      {['bg-pink-400', 'bg-yellow-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400'].map((color, i) => (
        <div
          key={i}
          className={`${color} rounded-full animate-balloon-float`}
          style={{
            width: 16 + i * 2,
            height: (16 + i * 2) * 1.2,
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            animationDelay: `${i * 0.3}s`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}