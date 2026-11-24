// Lightweight currency helper. Prices are always stored and settled in USD
// (manual Skrill/Payoneer transfers) — this only localises the display so a
// visitor in Pakistan sees an approximate PKR figure next to the USD amount.

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  /** app_settings column that stores the USD -> local rate */
  rateKey: string;
  fallbackRate: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateKey: 'usd_to_usd', fallbackRate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateKey: 'usd_to_eur', fallbackRate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateKey: 'usd_to_gbp', fallbackRate: 0.79 },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rateKey: 'usd_to_pkr', fallbackRate: 278 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateKey: 'usd_to_inr', fallbackRate: 83 },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rateKey: 'usd_to_aed', fallbackRate: 3.67 },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', rateKey: 'usd_to_sar', fallbackRate: 3.75 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateKey: 'usd_to_cad', fallbackRate: 1.36 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateKey: 'usd_to_aud', fallbackRate: 1.52 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rateKey: 'usd_to_bdt', fallbackRate: 118 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateKey: 'usd_to_ngn', fallbackRate: 1550 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', rateKey: 'usd_to_zar', fallbackRate: 18.5 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rateKey: 'usd_to_try', fallbackRate: 34 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rateKey: 'usd_to_myr', fallbackRate: 4.7 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rateKey: 'usd_to_idr', fallbackRate: 15800 },
];

const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  'Asia/Karachi': 'PKR',
  'Asia/Kolkata': 'INR',
  'Asia/Calcutta': 'INR',
  'Asia/Dhaka': 'BDT',
  'Asia/Dubai': 'AED',
  'Asia/Riyadh': 'SAR',
  'Asia/Istanbul': 'TRY',
  'Asia/Kuala_Lumpur': 'MYR',
  'Asia/Jakarta': 'IDR',
  'Africa/Lagos': 'NGN',
  'Africa/Johannesburg': 'ZAR',
  'Europe/London': 'GBP',
  'Europe/Dublin': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Paris': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
};

// Region subtags that unambiguously map to a currency.
const REGION_TO_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', PK: 'PKR', IN: 'INR', AE: 'AED', SA: 'SAR', CA: 'CAD',
  AU: 'AUD', BD: 'BDT', NG: 'NGN', ZA: 'ZAR', TR: 'TRY', MY: 'MYR', ID: 'IDR',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR',
};

export const getCurrency = (code?: string | null): CurrencyInfo =>
  CURRENCIES.find((c) => c.code?.toUpperCase() === String(code || '').toUpperCase()) || CURRENCIES[0];

export function detectCurrency(): string {
  try {
    if (typeof navigator !== 'undefined') {
      const locale = navigator.language || 'en-US';
      const region = locale.split('-')[1];
      if (region && REGION_TO_CURRENCY[region.toUpperCase()]) {
        return REGION_TO_CURRENCY[region.toUpperCase()];
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_TO_CURRENCY[tz]) return TIMEZONE_TO_CURRENCY[tz];
    }
  } catch {
    /* SSR / restricted browsers */
  }
  return 'USD';
}

export function getRate(settings: Record<string, any> | null | undefined, currency: CurrencyInfo): number {
  const configured = Number(settings?.[currency.rateKey]);
  return configured > 0 ? configured : currency.fallbackRate;
}

export function convertFromUsd(usd: number, settings: Record<string, any> | null | undefined, code: string): number {
  const currency = getCurrency(code);
  return Number(usd || 0) * getRate(settings, currency);
}

export function formatLocal(usd: number, settings: Record<string, any> | null | undefined, code: string): string {
  const currency = getCurrency(code);
  const value = convertFromUsd(usd, settings, code);
  const zeroDecimal = ['PKR', 'INR', 'IDR', 'NGN', 'BDT'].includes(currency.code);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: zeroDecimal ? 0 : 2,
    maximumFractionDigits: zeroDecimal ? 0 : 2,
  });
  return `${currency.symbol}${formatted} ${currency.code}`;
}
