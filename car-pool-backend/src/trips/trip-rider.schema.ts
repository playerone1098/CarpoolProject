import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TripRiderDocument = TripRider & Document;

@Schema({ timestamps: { createdAt: 'joined_at' } })
export class TripRider {
  @Prop({ type: Types.ObjectId, ref: 'Trip' })
  trip_id: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: string;
}

export const TripRiderSchema = SchemaFactory.createForClass(TripRider);
