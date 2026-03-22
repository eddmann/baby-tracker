/**
 * Given a local date "YYYY-MM-DD" and a UTC offset in minutes
 * (positive = east of UTC, e.g. 600 for UTC+10), returns the UTC
 * ISO timestamps for the start and end of that local day.
 */
export function localDateToUtcRange(
  date: string,
  offsetMinutes: number,
): { start: string; end: string } {
  const base = new Date(`${date}T00:00:00.000Z`);
  const startMs = base.getTime() - offsetMinutes * 60_000;
  const endMs = startMs + 86_400_000;
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
  };
}
