export function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

export function getSaturdayWeekNumber(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  let saturdayCount = 0;

  for (let day = 1; day <= date.getDate(); day += 1) {
    const candidate = new Date(year, month, day);
    if (isSaturday(candidate)) {
      saturdayCount += 1;
    }
  }

  return Math.min(Math.max(saturdayCount, 1), 4);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfCurrentMonth(): string {
  const date = new Date();
  return formatDateOnly(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfCurrentMonth(): string {
  const date = new Date();
  return formatDateOnly(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}
