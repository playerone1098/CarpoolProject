import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ default: 'User' })
  name: string;

  @Prop({ default: 'unspecified' })
  gender?: string;

  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  email?: string;

  @Prop()
  password?: string;

  @Prop({ default: 'free', enum: ['free', 'pro'] })
  mode: string;

  @Prop({ default: 'seeker', enum: ['seeker', 'driver', 'giver'] })
  role: string;

  @Prop({ default: false })
  isCarOwner: boolean;

  @Prop()
  profilePhoto?: string;

  @Prop()
  fcmToken?: string;

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

  @Prop({ type: Object })
  carInfo?: {
    model?: string;
    color?: string;
    plateNumber?: string;
  };

  @Prop({ type: Array, default: [] })
  bookmarks?: Array<{
    _id?: string;
    name: string;
    address: string;
    coords?: { lat: number; lng: number };
    icon?: string;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
