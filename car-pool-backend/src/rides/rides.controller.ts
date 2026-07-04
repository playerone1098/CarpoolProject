import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, Req } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  create(@Body() dto: CreateRideDto) {
    return this.ridesService.create(dto);
  }

  @Get()
  findAll() {
    return this.ridesService.findAll();
  }

  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string, @Query('sort') sortBy: string) {
    return this.ridesService.findByGroup(groupId, sortBy);
  }

  @Get('user/:userId')
  findUserHistory(@Param('userId') userId: string) {
    return this.ridesService.findUserHistory(userId);
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

  @Post(':id/book/:userId')
  bookSeat(@Param('id') rideId: string, @Param('userId') userId: string) {
    return this.ridesService.bookSeat(rideId, userId);
  }
}

