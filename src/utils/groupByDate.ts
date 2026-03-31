import { formatMessageDate } from './formatTime';

export function groupByDate(messages: any[]) {
  const groups: { [key: string]: any[] } = {};
  messages.forEach(msg => {
    const dateStr = formatMessageDate(msg.timestamp);
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(msg);
  });
  return groups;
}
