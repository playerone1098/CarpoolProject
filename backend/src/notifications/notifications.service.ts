import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private webPushEnabled = false;

  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectRepository(PushSubscription) private readonly pushSubRepo: Repository<PushSubscription>,
  ) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@example.com';

    if (publicKey && privateKey && !publicKey.includes('placeholder') && !privateKey.includes('placeholder')) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.webPushEnabled = true;
      } catch (e) {
        console.warn('⚠️ Web push initialization skipped: invalid or incomplete VAPID configuration.');
      }
    }
  }

  private normalizeNotif(notif: Notification): Notification {
    if (!notif) return notif;
    notif._id = notif.id;
    return notif;
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || 'info',
      read: false,
    });
    const saved = await this.notifRepo.save(notif);

    this.sendWebPush(dto.userId, dto.title, dto.message).catch((err) => {
      console.error('Failed to send background web push:', err);
    });

    return this.normalizeNotif(saved);
  }

  async subscribe(userId: string, dto: CreatePushSubscriptionDto): Promise<PushSubscription> {
    const existing = await this.pushSubRepo.findOne({ where: { endpoint: dto.endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.keys = dto.keys;
      const updated = await this.pushSubRepo.save(existing);
      updated._id = updated.id;
      return updated;
    }

    const newSub = this.pushSubRepo.create({
      userId,
      endpoint: dto.endpoint,
      keys: dto.keys,
    });
    const saved = await this.pushSubRepo.save(newSub);
    saved._id = saved.id;
    return saved;
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.pushSubRepo.delete({ userId, endpoint });
  }

  async sendWebPush(userId: string, title: string, message: string): Promise<void> {
    if (!this.webPushEnabled) return;

    const subs = await this.pushSubRepo.find({ where: { userId } });
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
          await this.pushSubRepo.delete(sub.id);
        } else {
          console.error(`Error sending push notification to endpoint ${sub.endpoint}:`, err);
        }
      }
    });

    await Promise.all(pushPromises);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    const notifs = await this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return notifs.map((n) => this.normalizeNotif(n));
  }

  async markAsRead(id: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({
      where: [{ id }, { _id: id }],
    });
    if (!notif) throw new NotFoundException('Notification not found');
    notif.read = true;
    const saved = await this.notifRepo.save(notif);
    return this.normalizeNotif(saved);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, read: false } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifRepo.update({ userId, read: false }, { read: true });
  }
}
