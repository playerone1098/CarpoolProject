import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './notification.schema';
import { PushSubscription } from './push-subscription.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<Notification>,
    @InjectModel(PushSubscription.name) private pushSubModel: Model<PushSubscription>,
  ) {
    const publicKey = process.env.VAPID_PUBLIC_KEY || 'BFP3qdq9BnXwPPbCG1WwU1tbgSYd3rO4vGXwAT5Jv4wSc9_E1s2aof6jIbhxxEL4dXmWf8dNUiWNRtLwqf-l8_k';
    const privateKey = process.env.VAPID_PRIVATE_KEY || 'JwfhSLZqERAtcxAVNH1d2ocyGQs5V3JV19oJncWAGSQ';
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@carpoolshare.com';

    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = new this.notifModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
    });
    const savedNotif = await notif.save();

    // Trigger Web Push in background
    this.sendWebPush(dto.userId, dto.title, dto.message).catch(err => {
      console.error('Failed to send background web push:', err);
    });

    return savedNotif;
  }

  async subscribe(userId: string, dto: CreatePushSubscriptionDto): Promise<PushSubscription> {
    const existing = await this.pushSubModel.findOne({ endpoint: dto.endpoint }).exec();
    if (existing) {
      existing.userId = new Types.ObjectId(userId);
      existing.keys = dto.keys;
      return existing.save();
    }

    const newSub = new this.pushSubModel({
      userId: new Types.ObjectId(userId),
      endpoint: dto.endpoint,
      keys: dto.keys,
    });
    return newSub.save();
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.pushSubModel.deleteOne({ userId: new Types.ObjectId(userId), endpoint }).exec();
  }

  async sendWebPush(userId: string, title: string, message: string): Promise<void> {
    const subs = await this.pushSubModel.find({ userId: new Types.ObjectId(userId) }).exec();
    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({
      title,
      body: message,
    });

    const pushPromises = subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys.auth,
          p256dh: sub.keys.p256dh,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing expired subscription: ${sub.endpoint}`);
          await this.pushSubModel.deleteOne({ _id: sub._id }).exec();
        } else {
          console.error(`Error sending push notification to endpoint ${sub.endpoint}:`, err);
        }
      }
    });

    await Promise.all(pushPromises);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notifModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async markAsRead(id: string): Promise<Notification> {
    const notif = await this.notifModel.findByIdAndUpdate(id, { read: true }, { new: true }).exec();
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifModel.countDocuments({ userId: new Types.ObjectId(userId), read: false }).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    ).exec();
  }
}
