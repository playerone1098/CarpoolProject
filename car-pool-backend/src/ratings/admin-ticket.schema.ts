import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminTicketDocument = AdminTicket & Document;

@Schema({ timestamps: true })
export class AdminTicket {
  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true })
  rideId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Rating' })
  ratingId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  safetyTags: string[];

  @Prop()
  comment?: string;

  @Prop({ default: 'HIGH', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  severity: string;

  @Prop({ default: 'OPEN', enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] })
  status: string;

  @Prop({ default: 'Automated Safety Alert from Rating <= 2 stars' })
  reason: string;
}

export const AdminTicketSchema = SchemaFactory.createForClass(AdminTicket);
