import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class Brief extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: User | Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: 'carpool' })
  type: string;

  @Prop({ type: Object })
  carpoolResult?: any;

  @Prop({ type: Object })
  generalResult?: any;

  @Prop()
  chatLog?: string;

  @Prop({ default: () => new Date().toISOString() })
  timestamp: string;
}

export const BriefSchema = SchemaFactory.createForClass(Brief);
