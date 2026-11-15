import type { Lang } from './model';
export const formatNumber = (n: number, lang: Lang, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-BD', options).format(n);
export const localizeDigits = (text: string, lang: Lang) => lang === 'bn' ? text.replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]) : text;
export function formatDate(value: string, lang: Lang) {
  const date = new Date(value + 'T12:00:00');
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-BD', { year: 'numeric', month: 'short', day: 'numeric' }).format(date) : value;
}
