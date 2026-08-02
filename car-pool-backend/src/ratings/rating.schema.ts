import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true, index: true })
  rideId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reviewerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  revieweeId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ trim: true })
  comment?: string;

  @Prop({ default: false })
  isSafetyIssue: boolean;

  @Prop({ default: false })
  isSkipped: boolean;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
// Create compound index for fast double-blind lookups and avoiding duplicates
RatingSchema.index({ rideId: 1, reviewerId: 1, revieweeId: 1 }, { unique: true });
