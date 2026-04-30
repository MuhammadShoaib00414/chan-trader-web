import { LARAVEL_BASE_URL } from './config';

const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'PKR 0';
  }

  return currencyFormatter.format(Number(value));
}

export function formatCompactNumber(value) {
  return compactFormatter.format(Number(value || 0));
}

export function formatRating(value) {
  const numericValue = Number(value || 0);
  return numericValue ? numericValue.toFixed(1) : 'New';
}

export function formatStockMessage(stockStatus) {
  return stockStatus?.message || 'Availability unknown';
}

export function resolveAssetUrl(path, fallbackLabel = 'Product') {
  if (!path) {
    return createPlaceholder(fallbackLabel);
  }

  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${LARAVEL_BASE_URL}${path}`;
  }

  return `${LARAVEL_BASE_URL}/${path}`;
}

function createPlaceholder(label) {
  const text = escapeXml(label.slice(0, 24));
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff1f1" />
          <stop offset="100%" stop-color="#ffe1d6" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#g)" />
      <circle cx="540" cy="90" r="80" fill="#1d4ed8" opacity="0.14" />
      <circle cx="95" cy="390" r="110" fill="#ff3a3d" opacity="0.16" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#2b2b34" font-family="Arial, sans-serif" font-size="28" font-weight="700">
        ${text}
      </text>
    </svg>`,
  )}`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
