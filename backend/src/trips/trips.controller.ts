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
  Put,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UsersService } from '../users/users.service';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly usersService: UsersService,
  ) {}

  private getDevUserId(headers: any): string | null {
    const rawId = headers['x-user-id'] || headers['X-User-Id'] || headers['x-user-id'.toLowerCase()];
    if (rawId) return rawId;

    const auth = headers['authorization'] || headers['Authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.substring(7);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          return payload.sub || payload.userId || null;
        }
      } catch (e) {}
    }
    return null;
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createTrip(@Body() dto: CreateTripDto, @Req() req: Request) {
    const devId = this.getDevUserId(req.headers as any);
    if (devId) {
      (dto as any).host_id = devId;
    }
    const trip = await this.tripsService.create(dto);
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
      const existing = await this.usersService.findByPhone(body.phone);
      let user;
      if (!existing) {
        user = await this.usersService.create({ phone: body.phone } as any);
      } else {
        user = existing;
      }
      userId = user.id || user._id;
    } else {
      throw new BadRequestException('Provide x-user-id header or { phone } in body');
    }

    return this.tripsService.joinTrip(id, userId);
  }

  @Put(':id')
  async updateTrip(@Param('id') id: string, @Body() dto: any, @Req() req: Request) {
    const devId = this.getDevUserId(req.headers as any);
    if (!devId) throw new BadRequestException('Provide x-user-id header or Authorization token');
    return this.tripsService.update(id, dto, devId);
  }

  @Delete(':id')
  async deleteTrip(@Param('id') id: string, @Req() req: Request) {
    const devId = this.getDevUserId(req.headers as any);
    if (!devId) throw new BadRequestException('Provide x-user-id header or Authorization token');
    return this.tripsService.remove(id, devId);
  }
}
