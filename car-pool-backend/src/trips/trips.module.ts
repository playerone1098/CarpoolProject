// src/trips/trips.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trip, TripSchema } from './trip.schema';
import { TripRider, TripRiderSchema } from './trip-rider.schema';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { UsersModule } from '../users/users.module'; // <--- import UsersModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
      { name: TripRider.name, schema: TripRiderSchema },
    ]),
    UsersModule, // <--- ensure it's here
  ],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
