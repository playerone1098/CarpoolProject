import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not } from 'typeorm';
import { ChatMessage } from './entities/chat.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private readonly chatRepo: Repository<ChatMessage>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private normalizeMessage(msg: ChatMessage): ChatMessage {
    if (!msg) return msg;
    msg._id = msg.id;
    return msg;
  }

  async sendMessage(
    rideId: string,
    senderId: string,
    senderName: string,
    text: string,
    receiverId?: string,
  ): Promise<ChatMessage> {
    const msg = this.chatRepo.create({
      rideId,
      senderId,
      senderName: senderName || 'User',
      receiverId,
      text,
    });

    const saved = await this.chatRepo.save(msg);
    this.normalizeMessage(saved);

    if (receiverId) {
      this.notificationsGateway.sendToUser(receiverId, 'new_chat_message', {
        _id: saved.id,
        id: saved.id,
        rideId,
        sender: senderId,
        senderName,
        text,
        createdAt: saved.createdAt?.toISOString() || new Date().toISOString(),
      });

      this.sendFcmPushNotification(receiverId, senderName, text, rideId).catch((err) => {
        console.log('[FCM] Push notification send error:', err?.message || err);
      });
    }

    return saved;
  }

  private async sendFcmPushNotification(
    receiverId: string,
    senderName: string,
    text: string,
    rideId: string,
  ) {
    const receiver = await this.userRepo.findOne({
      where: [{ id: receiverId }, { _id: receiverId }],
    });
    if (!receiver || !receiver.fcmToken) {
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const fcmServerKey = process.env.FCM_SERVER_KEY;

    if (projectId && (serviceAccountJson || process.env.FIREBASE_CLIENT_EMAIL)) {
      try {
        console.log(`[FCM v1] Sending push notification to user ${receiverId}...`);
        return;
      } catch (err: any) {
        console.error('[FCM v1] Error sending notification:', err?.message || err);
        return;
      }
    }

    if (fcmServerKey) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            to: receiver.fcmToken,
            priority: 'high',
            notification: {
              title: `New message from ${senderName}`,
              body: text,
              sound: 'default',
            },
            data: {
              type: 'chat',
              rideId: rideId,
              senderName: senderName,
              text: text,
            },
          }),
        });
        const resJson = await response.json();
        console.log(`[FCM Legacy] Push sent to user ${receiverId}:`, resJson);
      } catch (error) {
        console.error('[FCM Legacy] Failed to send push notification:', error);
      }
      return;
    }
  }

  async getRideMessages(rideId: string): Promise<ChatMessage[]> {
    const msgs = await this.chatRepo.find({
      where: [{ rideId }],
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
    return msgs.map((m) => this.normalizeMessage(m));
  }

  async getUnreadMessages(
    userId: string,
    since?: string,
  ): Promise<ChatMessage[]> {
    const whereClause: any = {
      receiverId: userId,
      senderId: Not(userId),
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        whereClause.createdAt = MoreThan(sinceDate);
      }
    }

    const msgs = await this.chatRepo.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
      take: 50,
      relations: ['sender'],
    });

    return msgs.map((m) => this.normalizeMessage(m));
  }
}
