import { Controller, Get, Post, Body, Param, Delete, Put, Patch, Query, UseGuards, Req } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  create(@Body() dto: CreateRideDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.ridesService.create(dto, userId);
  }

  // En-route search: GET /rides/search?pickupLat=...&pickupLng=...&dropLat=...&dropLng=...&radius=3
  @Get('search')
  searchEnRoute(
    @Query('pickupLat') pickupLat?: string,
    @Query('pickupLng') pickupLng?: string,
    @Query('dropLat') dropLat?: string,
    @Query('dropLng') dropLng?: string,
    @Query('radius') radius?: string,
  ) {
    return this.ridesService.searchEnRoute(
      pickupLat ? parseFloat(pickupLat) : undefined,
      pickupLng ? parseFloat(pickupLng) : undefined,
      dropLat ? parseFloat(dropLat) : undefined,
      dropLng ? parseFloat(dropLng) : undefined,
      radius ? parseFloat(radius) : 3,
    );
  }

  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string) {
    return this.ridesService.findByGroup(groupId);
  }

  @Get('user/:userId')
  findUserHistory(@Param('userId') userId: string) {
    return this.ridesService.findUserHistory(userId);
  }

  // Story 3.2: Live Tracking Endpoints
  @Get(':id/tracking')
  getRideTracking(@Param('id') id: string) {
    return this.ridesService.getRideTracking(id);
  }

  @Patch(':id/location')
  updateDriverLocation(
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number; bearing?: number; speed?: number },
  ) {
    return this.ridesService.updateDriverLocation(id, body);
  }

  @Patch(':id/trip-state')
  updateTripState(
    @Param('id') id: string,
    @Body() body: { tripState: string },
  ) {
    return this.ridesService.updateTripState(id, body.tripState);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ridesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRideDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.ridesService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.ridesService.remove(id, userId);
  }

  @Post(':id/book')
  bookSeatAuth(@Param('id') rideId: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.ridesService.bookSeat(rideId, userId);
  }

  @Post(':id/book/:userId')
  bookSeat(@Param('id') rideId: string, @Param('userId') userId: string) {
    return this.ridesService.bookSeat(rideId, userId);
  }
}

