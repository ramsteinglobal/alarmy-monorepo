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

/** Human countdown to a future fire time: "in 6h 20m", "in 45m", "in 1m", "ringing now". */
export function formatTimeUntil(target: Date, now = new Date()): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return 'ringing now';
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 1) return 'in less than a minute';
  if (totalMinutes < 60) return `in ${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes === 0 ? `in ${hours}h` : `in ${hours}h ${minutes}m`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours === 0 ? `in ${days}d` : `in ${days}d ${restHours}h`;
}
