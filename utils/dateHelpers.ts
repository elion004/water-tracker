import { format, subDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(getDateString(subDays(new Date(), i)));
  }
  return dates;
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, d. MMMM', { locale: de });
}

export function formatShortWeekday(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE', { locale: de });
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd. MMM', { locale: de });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen!';
  if (hour < 18) return 'Guten Tag!';
  return 'Guten Abend!';
}

export function formatMl(ml: number): string {
  if (ml >= 1000) {
    const liters = (ml / 1000).toFixed(1);
    return `${liters}L`;
  }
  return `${ml}ml`;
}
