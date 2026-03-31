/** Tarih string'ini [startDate, endDate] aralığına dahil mi? (baş/son tarihler önceden normalize edilmiş olmalı) */
export function isDateInRange(dateString: string, startDate: Date, endDate: Date): boolean {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date >= startDate && date <= endDate;
}

export function getThisMonthBounds(reference: Date = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getLastMonthBounds(reference: Date = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth(), 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
