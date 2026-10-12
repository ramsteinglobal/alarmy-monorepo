/** One place for 12-hour clock formatting. */
export function formatClock(date: Date): { time: string; period: 'AM' | 'PM' } {
  const h = date.getHours();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return { time: `${hour12}:${minutes}`, period: h >= 12 ? 'PM' : 'AM' };
}

/** Parse a stored "7:52" + "AM" pair. Falls back to 7:52 AM if the data is bad. */
export function parseStoredTime(time?: string, period?: string) {
  const [h, m] = (time ?? '').split(':').map(n => parseInt(n, 10));
  return {
    hour: Number.isInteger(h) && h >= 1 && h <= 12 ? h : 7,
    minute: Number.isInteger(m) && m >= 0 && m <= 59 ? m : 52,
    period: (period === 'AM' || period === 'PM' ? period : 'AM') as 'AM' | 'PM',
  };
}
