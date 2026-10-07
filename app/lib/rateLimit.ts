// Rate limiting for login attempts
// Tracks failed attempts by IP and username with escalating timeouts

interface AttemptRecord {
  count: number;
  lockedUntil: number; // timestamp when lock expires
}

const attemptStore = new Map<string, AttemptRecord>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attemptStore.entries()) {
    if (record.lockedUntil < now && record.count === 0) {
      attemptStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // every hour

function getKey(ip: string, username: string): string {
  return `${ip}:${username.toLowerCase()}`;
}

export function getLockDuration(attemptCount: number): number {
  // 5 attempts = 1 min, 10 attempts = 5 min, 15 attempts = 15 min, etc.
  const bracket = Math.floor(attemptCount / 5);
  if (bracket <= 0) return 0;
  const durations = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];
  return durations[Math.min(bracket - 1, durations.length - 1)];
}

export function checkRateLimit(ip: string, username: string): { allowed: boolean; remainingTime?: number; attemptCount: number } {
  const key = getKey(ip, username);
  const record = attemptStore.get(key);
  const now = Date.now();

  if (!record) {
    return { allowed: true, attemptCount: 0 };
  }

  if (record.lockedUntil > now) {
    return { 
      allowed: false, 
      remainingTime: record.lockedUntil - now,
      attemptCount: record.count
    };
  }

  // Lock expired, reset count
  if (record.count > 0) {
    attemptStore.set(key, { count: 0, lockedUntil: 0 });
  }

  return { allowed: true, attemptCount: record.count };
}

export function recordFailedAttempt(ip: string, username: string): { lockedUntil: number; attemptCount: number } {
  const key = getKey(ip, username);
  const record = attemptStore.get(key) || { count: 0, lockedUntil: 0 };
  
  record.count += 1;
  
  const lockDuration = getLockDuration(record.count);
  if (lockDuration > 0) {
    record.lockedUntil = Date.now() + lockDuration;
  }
  
  attemptStore.set(key, record);
  
  return { lockedUntil: record.lockedUntil, attemptCount: record.count };
}

export function clearAttempts(ip: string, username: string): void {
  const key = getKey(ip, username);
  attemptStore.delete(key);
}

export function formatLockTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 1) return "less than a minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''}`;
}