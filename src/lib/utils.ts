export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}z in urma`;
  if (hours > 0) return `${hours}h in urma`;
  if (minutes > 0) return `${minutes}m in urma`;
  return 'acum cateva secunde';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getShiftDuration(clockIn: string, clockOut: string | null): string {
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const diffMs = end - new Date(clockIn).getTime();
  const minutes = Math.floor(diffMs / 60000);
  return formatDuration(minutes);
}

export function isShiftActive(clockOut: string | null): boolean {
  return !clockOut;
}
