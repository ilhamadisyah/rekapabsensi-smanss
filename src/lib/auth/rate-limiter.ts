import { NextRequest } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store untuk rate limiting sliding window
const rateLimitStore = new Map<string, RateLimitRecord>();

// Bersihkan data usang setiap 5 menit agar memori tetap hemat & aman
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    // Buang timestamp yang lebih tua dari 1 jam
    record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
}

/**
 * Memeriksa limit request berdasarkan kunci (IP / User) dalam jendela waktu (ms)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter hanya timestamp dalam jendela aktif
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTimeMs = oldest + windowMs - now;
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTimeMs: Math.max(0, resetTimeMs),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetTimeMs: windowMs,
  };
}

/**
 * Ekstraksi IP Client dari NextRequest
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Proteksi Brute Force Login: Maksimal 5 percobaan per 15 menit per IP
 */
export function checkAuthRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`auth:${ip}`, 5, 15 * 60 * 1000);
}

/**
 * Proteksi Global API Anti-DDoS: Maksimal 120 request per menit per IP
 */
export function checkGlobalRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`global:${ip}`, 120, 60 * 1000);
}
