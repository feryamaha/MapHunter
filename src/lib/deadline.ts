// ─── Deadline helper for long-running Vercel functions ───────────────────────
//
// Vercel kills serverless functions after the plan timeout (Hobby ~10s, Pro 60s).
// Using a Deadline lets the route stop gracefully and return partial results
// instead of a 504 Gateway Timeout.

export class Deadline {
  private readonly startMs: number;

  constructor(private readonly limitMs: number) {
    this.startMs = Date.now();
  }

  elapsed(): number {
    return Date.now() - this.startMs;
  }

  remaining(): number {
    return Math.max(0, this.limitMs - this.elapsed());
  }

  isExpired(): boolean {
    return this.remaining() <= 0;
  }

  isNearEnd(thresholdMs = 5000): boolean {
    return this.remaining() <= thresholdMs;
  }
}

export function defaultRouteDeadlineMs(): number {
  // 50s gives a safety margin for the 60s Pro maxDuration. If you are on
  // Vercel Hobby (10s limit), set LEADS_ROUTE_DEADLINE_MS=9000 in the project.
  return Number(process.env.LEADS_ROUTE_DEADLINE_MS ?? 50_000);
}
