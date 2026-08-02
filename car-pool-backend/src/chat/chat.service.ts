import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage } from './chat.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessage>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async sendMessage(
    rideId: string,
    senderId: string,
    senderName: string,
    text: string,
    receiverId?: string,
  ): Promise<ChatMessage> {
    const msg = new this.chatModel({
      rideId: new Types.ObjectId(rideId),
      sender: new Types.ObjectId(senderId),
      senderName: senderName || 'User',
      receiver: receiverId && Types.ObjectId.isValid(receiverId) ? new Types.ObjectId(receiverId) : undefined,
      text,
    });

    const saved = await msg.save();

    // Push real-time WS event to receiver if connected
    if (receiverId) {
      this.notificationsGateway.sendToUser(receiverId, 'new_chat_message', {
        _id: saved._id,
        rideId,
        sender: senderId,
        senderName,
        text,
        createdAt: (saved as any).createdAt || new Date().toISOString(),
      });
    }

    return saved;
  }

  async getRideMessages(rideId: string): Promise<ChatMessage[]> {
    if (!Types.ObjectId.isValid(rideId)) return [];
    return this.chatModel
      .find({ rideId: new Types.ObjectId(rideId) })
      .sort({ createdAt: 1 })
      .exec();
  }
}
