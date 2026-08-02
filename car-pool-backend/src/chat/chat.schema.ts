import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChatMessage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true })
  rideId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ required: true })
  senderName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  receiver?: Types.ObjectId;

  @Prop({ required: true })
  text: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
