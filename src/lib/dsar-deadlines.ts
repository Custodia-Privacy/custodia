/** Calendar-day deadlines by jurisdiction (simplified). */

const JURISDICTION_DEADLINES: Record<string, number> = {
  gdpr: 30,
  ccpa: 45,
  lgpd: 15,
  pipeda: 30,
};

export function computeDsarDueDate(jurisdiction: string, fromDate: Date = new Date()): Date {
  const days = JURISDICTION_DEADLINES[jurisdiction.toLowerCase()] ?? 30;
  const due = new Date(fromDate);
  due.setDate(due.getDate() + days);
  return due;
}
