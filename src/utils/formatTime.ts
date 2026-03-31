import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export function formatMessageTime(timestamp: number) {
  return format(new Date(timestamp), 'HH:mm');
}

export function formatMessageDate(timestamp: number) {
  const date = new Date(timestamp);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

export function formatRelativeTime(timestamp: number) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}
