import React from 'react';
import { Clock3, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  buildFlashSaleMessage,
  getFlashSaleCountdownLabel,
  isFlashSaleActive,
  normalizeFlashSale,
} from '@/lib/flashSale';

export default function FlashSaleBanner({ flashSale, now = new Date(), className }) {
  const sale = normalizeFlashSale(flashSale);

  if (!isFlashSaleActive(sale, now)) {
    return null;
  }

  const countdown = getFlashSaleCountdownLabel(sale, now);

  return (
    <div
      className={cn(
        'border-b border-black/10 bg-[linear-gradient(135deg,#ffefe1_0%,#ffd19a_38%,#ff9f68_100%)] text-slate-950',
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 text-xs font-semibold sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:text-sm">
        <div className="flex items-start gap-2 lg:items-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white lg:text-[11px]">
            <Sparkles className="h-3 w-3" />
            {sale.label || 'FLASH SALE'}
          </span>
          <p className="leading-snug text-slate-950/90">
            {buildFlashSaleMessage(sale)}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold text-slate-900 shadow-sm backdrop-blur lg:text-xs">
          <Clock3 className="h-3.5 w-3.5" />
          {countdown}
        </div>
      </div>
    </div>
  );
}
