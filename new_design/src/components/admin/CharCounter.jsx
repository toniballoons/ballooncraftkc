import React from 'react';
import { getCounterColor } from '@/lib/seo';

/**
 * Displays a character count with color feedback.
 * Green = optimal range, Red = over limit, Gray = under optimal.
 */
export default function CharCounter({ value = '', max, optimalMin }) {
  const len = (value || '').length;
  const color = getCounterColor(len, max, optimalMin);

  const colorClass = {
    red: 'text-red-500',
    green: 'text-green-600',
    gray: 'text-muted-foreground',
  }[color];

  return (
    <p className={`text-xs mt-0.5 text-right ${colorClass}`}>
      {len} / {max}
      {color === 'red' && ' — too long'}
      {color === 'green' && ' — great length'}
    </p>
  );
}
