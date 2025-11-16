import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TripDocument = Trip & Document;

@Schema({ timestamps: { createdAt: 'created_at' } })
export class Trip {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  host_id?: string;

  @Prop()
  title: string;

  @Prop()
  start_time?: Date;

  @Prop({ type: Object })
  origin?: any;

  @Prop({ type: Object })
  destination?: any;

  @Prop()
  route_polyline?: string;

  @Prop({ default: 1 })
  seats_total: number;

  @Prop({ default: 1 })
  seats_available: number;

  @Prop({ default: 'active' })
  status: string;
}

export const TripSchema = SchemaFactory.createForClass(Trip);
