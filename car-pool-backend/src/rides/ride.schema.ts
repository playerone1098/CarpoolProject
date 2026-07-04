import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Ride extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  driver: Types.ObjectId;

  @Prop({ required: true })
  carModel: string;

  @Prop({ required: true })
  seatsAvailable: number;

  @Prop({ required: true })
  pickupLocation: string;

  @Prop({ required: true })
  dropLocation: string;

  @Prop({ required: true })
  rideTime: Date;

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

