import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALL_ENTITIES } from './entities';
import { SeedService } from './seed.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbType = (process.env.DB_TYPE || 'postgres').toLowerCase();

        if (dbType === 'sqlite') {
          console.log('📦 Using SQLite Database engine for offline local dev fallback');
          return {
            type: 'sqlite',
            database: process.env.SQLITE_DB || 'carpool_dev.sqlite',
            entities: ALL_ENTITIES,
            synchronize: true,
          };
        }

        const host = process.env.POSTGRES_HOST || '127.0.0.1';
        const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
        const username = process.env.POSTGRES_USER || 'postgres';
        const password = process.env.POSTGRES_PASSWORD || 'postgres';
        const database = process.env.POSTGRES_DB || 'carpool';
        const url = process.env.DATABASE_URL;

        console.log(`🐘 Connecting to PostgreSQL at ${host}:${port}/${database} (synchronize: true)`);

        return {
          type: 'postgres',
          url: url || undefined,
          host: url ? undefined : host,
          port: url ? undefined : port,
          username: url ? undefined : username,
          password: url ? undefined : password,
          database: url ? undefined : database,
          entities: ALL_ENTITIES,
          synchronize: true,
          logging: process.env.TYPEORM_LOGGING === 'true',
        };
      },
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  providers: [SeedService],
  exports: [SeedService, TypeOrmModule],
})
export class DatabaseModule {}
