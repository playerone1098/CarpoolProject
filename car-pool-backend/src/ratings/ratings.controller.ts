import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createRating(@Body() dto: CreateRatingDto, @Req() req: any) {
    const reviewerId = req.user?.userId;
    return this.ratingsService.createRating(dto, reviewerId);
  }

  @Get('ride/:rideId')
  @UseGuards(JwtAuthGuard)
  getRideRatings(@Param('rideId') rideId: string, @Req() req: any) {
    const currentUserId = req.user?.userId;
    return this.ratingsService.getRideRatings(rideId, currentUserId);
  }

  @Get('user/:userId')
  getUserRatingSummary(@Param('userId') userId: string) {
    return this.ratingsService.getUserRatingSummary(userId);
  }

  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard)
  getAdminTickets() {
    return this.ratingsService.getAdminTickets();
  }
}
