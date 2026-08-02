import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RidesModule } from './rides/rides.module';
import { GroupsModule } from './groups/groups.module';
import { ChatModule } from './chat/chat.module';
import { RatingsModule } from './ratings/ratings.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    RedisModule,
    MongooseModule.forRoot(
      process.env.MONGODB_URI || (() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('FATAL: MONGODB_URI environment variable is required in production mode!');
        }
        console.warn('⚠️ MONGODB_URI not provided. Falling back to local development database: mongodb://127.0.0.1:27017/carpool_dev');
        return 'mongodb://127.0.0.1:27017/carpool_dev';
      })(),
      {
        dbName: process.env.MONGODB_DB || 'carpool',
      }
    ),
    UsersModule,
    TripsModule,
    AuthModule,
    NotificationsModule,
    RidesModule,
    GroupsModule,
    ChatModule,
    RatingsModule,
    PaymentsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

