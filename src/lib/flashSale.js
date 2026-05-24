export const DEFAULT_FLASH_SALE = {
  enabled: false,
  label: 'FLASH SALE',
  duration_minutes: 60,
  activated_at: null,
  expires_at: null,
  offer_type: 'percent',
  offer_value: '15',
  promo_code: '',
  mention_channel: 'phone_or_email',
  fixed_text: '',
  extra_note: '',
};

export function normalizeFlashSale(flashSale) {
  return {
    ...DEFAULT_FLASH_SALE,
    ...(flashSale || {}),
  };
}

export function armFlashSale(flashSale, durationMinutes) {
  const next = normalizeFlashSale(flashSale);
  const safeDuration = Math.max(1, Number(durationMinutes || next.duration_minutes || 60));
  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt.getTime() + safeDuration * 60 * 1000);

  return {
    ...next,
    enabled: true,
    duration_minutes: safeDuration,
    activated_at: activatedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
}

export function disableFlashSale(flashSale) {
  return {
    ...normalizeFlashSale(flashSale),
    enabled: false,
    activated_at: null,
    expires_at: null,
  };
}

export function isFlashSaleActive(flashSale, now = new Date()) {
  const sale = normalizeFlashSale(flashSale);
  if (!sale.enabled || !sale.expires_at) return false;

  const expiresAt = new Date(sale.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() > now.getTime();
}

export function formatFlashSaleOffer(flashSale) {
  const sale = normalizeFlashSale(flashSale);
  const numericValue = String(sale.offer_value || '').trim();

  switch (sale.offer_type) {
    case 'percent':
      return numericValue ? `${numericValue}% off` : 'special percentage savings';
    case 'dollars':
      return numericValue ? `$${numericValue} off` : 'special dollar savings';
    case 'freebie':
      return sale.fixed_text?.trim() || numericValue || 'a bonus add-on';
    case 'custom':
      return sale.fixed_text?.trim() || 'a limited-time offer';
    default:
      return sale.fixed_text?.trim() || 'a limited-time offer';
  }
}

export function formatMentionInstruction(flashSale) {
  const sale = normalizeFlashSale(flashSale);
  const promoCode = sale.promo_code?.trim();
  const codeText = promoCode ? `Mention code ${promoCode}` : 'Mention this flash sale';

  switch (sale.mention_channel) {
    case 'phone':
      return `${codeText} in your initial phone interaction.`;
    case 'email':
      return `${codeText} in your initial email interaction.`;
    case 'phone_or_email':
    default:
      return `${codeText} in your initial phone or email interaction.`;
  }
}

export function getFlashSaleCountdownLabel(flashSale, now = new Date()) {
  const sale = normalizeFlashSale(flashSale);
  if (!sale.expires_at) return '';

  const expiresAt = new Date(sale.expires_at);
  const millisecondsLeft = expiresAt.getTime() - now.getTime();
  if (Number.isNaN(millisecondsLeft) || millisecondsLeft <= 0) return 'Expired';

  const totalMinutes = Math.max(1, Math.ceil(millisecondsLeft / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min left`;
  }

  if (minutes === 0) {
    return `${hours} hr left`;
  }

  return `${hours} hr ${minutes} min left`;
}

export function buildFlashSaleMessage(flashSale) {
  const sale = normalizeFlashSale(flashSale);
  const parts = [
    formatFlashSaleOffer(sale),
    formatMentionInstruction(sale),
  ];

  if (sale.extra_note?.trim()) {
    parts.push(sale.extra_note.trim());
  }

  return parts.join(' ');
}
