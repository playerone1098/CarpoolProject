import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notifService.create(dto);
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
