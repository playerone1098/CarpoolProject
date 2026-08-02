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

  @Prop({ default: 0 })
  price?: number;
}

export const RideSchema = SchemaFactory.createForClass(Ride);

