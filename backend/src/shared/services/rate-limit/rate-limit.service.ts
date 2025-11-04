import { Injectable } from "@nestjs/common";

type Bucket = {
  count: number;
  windowStart: number; // epoch ms
};

@Injectable()
export class RateLimitService {
  private buckets = new Map<string, Bucket>();

  check(key: string, max: number, windowMs: number): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return;
    }

    if (bucket.count >= max) {
      const resetIn = Math.max(0, windowMs - (now - bucket.windowStart));
      const err: any = new Error("Too Many Requests");
      err.status = 429;
      err.resetIn = resetIn;
      throw err;
    }

    bucket.count += 1;
  }
}
