import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
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
