import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function isExpiringSoon(
  endDate: string | undefined | null,
  daysThreshold = 30
): boolean {
  if (!endDate) return false;
  try {
    const days = differenceInDays(parseISO(endDate), new Date());
    return days >= 0 && days <= daysThreshold;
  } catch {
    return false;
  }
}

export function isExpired(endDate: string | undefined | null): boolean {
  if (!endDate) return false;
  try {
    return differenceInDays(parseISO(endDate), new Date()) < 0;
  } catch {
    return false;
  }
}

export function daysUntilExpiry(endDate: string | undefined | null): number | null {
  if (!endDate) return null;
  try {
    return differenceInDays(parseISO(endDate), new Date());
  } catch {
    return null;
  }
}

export function getFullName(
  profile: { first_name: string; last_name: string } | undefined | null
): string {
  if (!profile) return '—';
  return `${profile.first_name} ${profile.last_name}`.trim();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}
