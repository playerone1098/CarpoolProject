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
        if (process.env.REDIS_URL) {
          logger.log('Connecting to Redis instance via REDIS_URL...');
          const redis = new Redis(process.env.REDIS_URL);
          redis.on('error', (err) => {
            logger.error(`Redis Error: ${err.message}`);
          });
          return redis;
        }

        logger.warn('⚠️ REDIS_URL not configured. Falling back to built-in In-Memory cache.');
        return new InMemoryCache() as unknown as Redis;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}


