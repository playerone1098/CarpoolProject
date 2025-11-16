import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UsersService } from '../users/users.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService, private readonly usersService: UsersService) {}

  private getDevUserId(headers: any) {
    return headers['x-user-id'] || headers['X-User-Id'] || headers['x-user-id'.toLowerCase()] || null;
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createTrip(@Body() dto: CreateTripDto, @Req() req: Request) {
    // If the request has x-user-id, set as host_id (optional)
    const devId = this.getDevUserId(req.headers as any);
    const trip = await this.tripsService.create(dto);
    if (devId) {
      // attach host_id (optional update)
      (trip as any).host_id = devId;
      await (trip as any).save?.(); // if trip is a Mongoose doc
    }
    return trip;
  }

  @Get()
  async listTrips() {
    return this.tripsService.findAll();
  }

  @Get(':id')
  async getTrip(@Param('id') id: string) {
    const t = await this.tripsService.findById(id);
    if (!t) throw new NotFoundException('Trip not found');
    return t;
  }

  @Post(':id/join')
  async joinTrip(@Param('id') id: string, @Req() req: Request, @Body() body?: { phone?: string }) {
    const devId = this.getDevUserId(req.headers as any);
    let userId: string | null = null;

    if (devId) {
      userId = devId as string;
    } else if (body && body.phone) {
      // upsert or fetch user by phone, then use its id
      const existing = await this.usersService.findByPhone(body.phone);
      let user;
      if (!existing) {
        user = await this.usersService.create({ phone: body.phone } as any);
      } else {
        user = existing;
      }
      userId = (user as any)._id?.toString() ?? (user as any).id?.toString();
    } else {
      throw new BadRequestException('Provide x-user-id header or { phone } in body');
    }

    // Now perform the join transaction
    return this.tripsService.joinTrip(id, userId);
  }
}
