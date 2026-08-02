import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true })
  rideId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  rider: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  driver: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 1 })
  seats: number;

  @Prop({ required: true, enum: ['wallet', 'upi', 'cash'] })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: ['hold', 'pending_cash', 'captured', 'completed', 'refunded', 'failed'],
    default: 'hold',
  })
  status: string;

  @Prop({ default: 0 })
  platformFee: number;

  @Prop({ default: 0 })
  driverEarnings: number;

  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop()
  cashConfirmedAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
