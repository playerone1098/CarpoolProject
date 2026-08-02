import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Ride extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  driver: Types.ObjectId;

  @Prop({ default: 'Community Driver' })
  driverName?: string;

  @Prop({ default: 'Standard Sedan' })
  carModel: string;

  @Prop({ default: 'Commute Ride' })
  title?: string;

  @Prop({ default: 3 })
  seatsAvailable: number;

  @Prop({ default: 3 })
  availableSeats?: number;

  @Prop({ default: 'Pickup Point' })
  pickupLocation: string;

  @Prop({ default: 'Pickup Point' })
  pickup?: string;

  @Prop({ default: 'Drop Location' })
  dropLocation: string;

  @Prop({ default: 'Drop Location' })
  drop?: string;

  @Prop({ default: 'Destination' })
  destination?: string;

  @Prop({ default: Date.now })
  rideTime: Date;

  @Prop({ default: 'Scheduled' })
  time?: string;

  @Prop({ type: Types.ObjectId, ref: 'Group' })
  groupId?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  passengers: Types.ObjectId[];

  @Prop({ type: Object })
  pickupCoords?: { lat: number; lng: number };

  @Prop({ type: Object })
  dropCoords?: { lat: number; lng: number };

  // Driving route polyline from OSRM — array of [lat, lng] points along the route
  // Used for en-route matching (finding if a searcher's pickup/drop falls along this ride's path)
  @Prop({ type: [[Number]], default: [] })
  routeGeometry?: number[][];

  @Prop({ default: 0 })
  price?: number;

  @Prop({ default: 'scheduled', enum: ['scheduled', 'ongoing', 'completed', 'cancelled'] })
  status?: string;

  // Real-Time Vehicle Live Tracking Fields (Story 3.2)
  @Prop({
    default: 'DRIVER_EN_ROUTE',
    enum: ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_IN_PROGRESS', 'TRIP_COMPLETED'],
  })
  tripState?: string;

  @Prop({ type: Object })
  driverLocation?: {
    lat: number;
    lng: number;
    bearing?: number;
    speed?: number;
    updatedAt?: Date;
  };

  @Prop({ default: 'MH 04 AB 1234' })
  licensePlate?: string;

  @Prop({ default: 4.9 })
  driverRating?: number;

  @Prop({ default: '+91 98765 43210' })
  driverPhone?: string;
}

export const RideSchema = SchemaFactory.createForClass(Ride);

