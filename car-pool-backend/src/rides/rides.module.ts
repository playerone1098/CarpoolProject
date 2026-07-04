import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { Ride, RideSchema } from './ride.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ride.name, schema: RideSchema }]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [RidesController],
  providers: [RidesService],
})
export class RidesModule {}
