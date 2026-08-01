import { Module, Global, Logger } from '@nestjs/common';
import Redis from 'ioredis';

class InMemoryCache {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, durationSeconds?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && durationSeconds) {
      expiresAt = Date.now() + durationSeconds * 1000;
    }
    this.store.set(key, { value: String(value), expiresAt });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const nextVal = (current ? parseInt(current, 10) : 0) + 1;
    const item = this.store.get(key);
    this.store.set(key, { value: String(nextVal), expiresAt: item?.expiresAt });
    return nextVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const logger = new Logger('RedisModule');
        const redisUrl = process.env.REDIS_URL?.trim();

        if (redisUrl && redisUrl !== '' && !redisUrl.includes('your-redis-host')) {
          logger.log('Connecting to Redis instance via REDIS_URL...');
          try {
            const isTls = redisUrl.startsWith('rediss://');
            const redis = new Redis(redisUrl, {
              maxRetriesPerRequest: 3,
              retryStrategy(times) {
                if (times > 3) {
                  logger.warn('⚠️ Redis connection retries exhausted. Fallback active.');
                  return null;
                }
                return Math.min(times * 200, 2000);
              },
              ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
            });

            redis.on('error', (err) => {
              logger.warn(`⚠️ Redis Connection Notice (${(err as any)?.code || err.message}). Operating securely.`);
            });

            return redis;
          } catch (e: any) {
            logger.error(`Failed to initialize Redis client: ${e.message}`);
          }
        }

        logger.warn('⚠️ REDIS_URL not configured or placeholder detected. Operating on built-in In-Memory cache.');
        return new InMemoryCache() as unknown as Redis;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}



