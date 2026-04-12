import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ default: 'User' })
  name: string;

  @Prop({ default: 'free', enum: ['free', 'pro'] })
  mode: string;

  @Prop()
  profilePhoto?: string;

  @Prop({ type: Object })
  homeAddress?: {
    type?: string;
    address: string;
    coords: { lat: number; lng: number };
  };

  @Prop({ type: Object })
  workAddress?: {
    type?: string;
    address: string;
    coords: { lat: number; lng: number };
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
