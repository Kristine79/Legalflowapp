import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

export function formatDate(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy', { locale: ru });
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy HH:mm', { locale: ru });
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });
}
