import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('ride/:rideId')
  getRideMessages(@Param('rideId') rideId: string) {
    return this.chatService.getRideMessages(rideId);
  }

  /**
   * Returns messages sent TO the current user since a given timestamp.
   * Used by the frontend notification system.
   * GET /chat/unread?since=2024-01-01T00:00:00.000Z
   */
  @Get('unread')
  getUnreadMessages(
    @Req() req: any,
    @Query('since') since?: string,
  ) {
    const userId = req.user?.userId;
    return this.chatService.getUnreadMessages(userId, since);
  }

  @Post('send')
  sendMessage(
    @Body() body: { rideId: string; text: string; receiverId?: string },
    @Req() req: any,
  ) {
    const senderId = req.user?.userId;
    const senderName = req.user?.name || req.user?.email || 'User';
    return this.chatService.sendMessage(
      body.rideId,
      senderId,
      senderName,
      body.text,
      body.receiverId,
    );
  }
}
