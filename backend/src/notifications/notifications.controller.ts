import { Controller, Get, Post, Body, Param, Put, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notifService.create(dto);
  }

  @Post('subscribe')
  subscribe(@Body() dto: CreatePushSubscriptionDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.notifService.subscribe(userId, dto);
  }

  @Post('unsubscribe')
  unsubscribe(@Body('endpoint') endpoint: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.notifService.unsubscribe(userId, endpoint);
  }

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'mock-vapid-public-key-offline-mode'
    };
  }

  @Get('unread-count/:userId')
  async unreadCount(@Param('userId') userId: string) {
    const count = await this.notifService.unreadCount(userId);
    return { count };
  }

  @Put('read-all/:userId')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notifService.markAllAsRead(userId);
  }

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.notifService.findByUser(userId);
  }

  @Put('read/:id')
  markAsRead(@Param('id') id: string) {
    return this.notifService.markAsRead(id);
  }
}
