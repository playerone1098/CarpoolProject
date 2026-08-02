import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LedgerDocument = Ledger & Document;

@Schema({ timestamps: true })
export class Ledger {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ride' })
  rideId?: Types.ObjectId;

  @Prop({ required: true, enum: ['credit', 'debit'] })
  type: string;

  @Prop({ required: true })
  grossAmount: number;

  @Prop({ default: 0 })
  platformFee: number;

  @Prop({ required: true })
  netAmount: number;

  @Prop({ default: 'wallet' })
  paymentMethod: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object })
  metadata?: any;
}

export const LedgerSchema = SchemaFactory.createForClass(Ledger);
