import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { GroupsModule } from './groups/groups.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RidesModule } from './rides/rides.module';

@Module({
  imports: [
    RedisModule,
    MongooseModule.forRoot(process.env.MONGODB_URI!, {
      dbName: process.env.MONGODB_DB || 'carpool',
    }),
    UsersModule,
    TripsModule,
    AuthModule,
    GroupsModule,
    NotificationsModule,
    RidesModule,
  ],
})
export class AppModule {}
