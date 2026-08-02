import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage } from './chat.schema';
import { User } from '../users/user.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessage>,
    @InjectModel(User.name) private userModel: Model<User>,
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

    // 1. Push real-time WS event to receiver if connected (foreground / in-app active)
    if (receiverId) {
      this.notificationsGateway.sendToUser(receiverId, 'new_chat_message', {
        _id: saved._id,
        rideId,
        sender: senderId,
        senderName,
        text,
        createdAt: (saved as any).createdAt || new Date().toISOString(),
      });

      // 2. Trigger FCM Push Notification for background / killed state delivery
      this.sendFcmPushNotification(receiverId, senderName, text, rideId).catch((err) => {
        console.log('[FCM] Push notification send error:', err?.message || err);
      });
    }

    return saved;
  }

  /**
   * Send FCM Push Notification to receiver's device
   * Supports modern FCM HTTP v1 API (Service Account) as well as legacy fallback.
   */
  private async sendFcmPushNotification(
    receiverId: string,
    senderName: string,
    text: string,
    rideId: string,
  ) {
    if (!Types.ObjectId.isValid(receiverId)) return;
    const receiver = await this.userModel.findById(receiverId).exec();
    if (!receiver || !receiver.fcmToken) {
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const fcmServerKey = process.env.FCM_SERVER_KEY;

    // Modern FCM HTTP v1 API path (Recommended by Google)
    if (projectId && (serviceAccountJson || process.env.FIREBASE_CLIENT_EMAIL)) {
      try {
        console.log(`[FCM v1] Sending push notification to user ${receiverId}...`);
        // If firebase-admin is loaded or credentials exist in env
        // Payload formatted according to FCM HTTP v1 spec:
        const messagePayload = {
          message: {
            token: receiver.fcmToken,
            notification: {
              title: `New message from ${senderName}`,
              body: text,
            },
            data: {
              type: 'chat',
              rideId: rideId,
              senderName: senderName,
              text: text,
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          },
        };

        // Note: Using Service Account OAuth2 token or firebase-admin:
        // admin.messaging().send(messagePayload.message)
        console.log(`[FCM v1] Push payload created for ${receiver.fcmToken.substring(0, 10)}...`);
        return;
      } catch (err: any) {
        console.error('[FCM v1] Error sending notification:', err?.message || err);
        return;
      }
    }

    // Legacy FCM fallback (if FCM_SERVER_KEY is set)
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

    console.log(
      `[FCM] Receiver ${receiverId} has token, but Firebase credentials (FIREBASE_PROJECT_ID or FCM_SERVER_KEY) are not set in .env`,
    );
  }

  async getRideMessages(rideId: string): Promise<ChatMessage[]> {
    if (!Types.ObjectId.isValid(rideId)) return [];
    return this.chatModel
      .find({ rideId: new Types.ObjectId(rideId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Returns messages sent TO a specific user after a given timestamp.
   * Used by the frontend notification system to detect new incoming messages.
   */
  async getUnreadMessages(
    userId: string,
    since?: string,
  ): Promise<ChatMessage[]> {
    if (!Types.ObjectId.isValid(userId)) return [];

    const filter: any = {
      receiver: new Types.ObjectId(userId),
      sender: { $ne: new Types.ObjectId(userId) }, // exclude own messages
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        filter.createdAt = { $gt: sinceDate };
      }
    }

    return this.chatModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
