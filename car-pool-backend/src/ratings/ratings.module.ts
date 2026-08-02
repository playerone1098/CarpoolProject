import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { Rating, RatingSchema } from './rating.schema';
import { AdminTicket, AdminTicketSchema } from './admin-ticket.schema';
import { User, UserSchema } from '../users/user.schema';
import { Ride, RideSchema } from '../rides/ride.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rating.name, schema: RatingSchema },
      { name: AdminTicket.name, schema: AdminTicketSchema },
      { name: User.name, schema: UserSchema },
      { name: Ride.name, schema: RideSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
