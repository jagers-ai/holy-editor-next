export function formatDate(d: string | Date, locale = 'ko-KR'): string {
  const date = new Date(d);
  return date.toLocaleDateString(locale);
}

export function formatDateTimeKST(d: string | Date): string {
  const date = new Date(d);
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const y = get('year');
  const m = get('month');
  const day = get('day');
  const hh = get('hour');
  const mm = get('minute');
  return `${y}${m}${day}-${hh}${mm}`;
}

