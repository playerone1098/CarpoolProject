import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notifModel: Model<Notification>) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = new this.notifModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
    });
    return notif.save();
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
