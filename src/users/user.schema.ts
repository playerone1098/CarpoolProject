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
}

export const UserSchema = SchemaFactory.createForClass(User);
