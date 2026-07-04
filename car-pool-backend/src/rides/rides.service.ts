import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ride } from './ride.schema';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RidesService {
  constructor(
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateRideDto): Promise<Ride> {
    if (new Date(dto.rideTime) < new Date()) {
      throw new BadRequestException('Cannot create a ride in the past');
    }
    const ride = new this.rideModel(dto);
    return ride.save();
  }

  async findAll(): Promise<Ride[]> {
    return this.rideModel
      .find({ rideTime: { $gte: new Date() } })
      .populate('driver passengers')
      .exec();
  }

  async findUserHistory(userId: string): Promise<Ride[]> {
    const rawRides = await this.rideModel.collection.find({
      $or: [
        { driver: userId },
        { driver: new Types.ObjectId(userId) },
        { passengers: userId },
        { passengers: new Types.ObjectId(userId) }
      ]
    }).toArray();

    return this.rideModel.populate(rawRides, { path: 'driver passengers' }) as unknown as Ride[];
  }

  async findOne(id: string): Promise<Ride> {
    const ride = await this.rideModel.findById(id).populate('driver passengers').exec();
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  async update(id: string, dto: UpdateRideDto, userId: string): Promise<Ride> {
    const ride = await this.rideModel.findById(id).exec();
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driver.toString() !== userId) {
      throw new ForbiddenException('You can only edit rides posted by you');
    }
    if (dto.rideTime && new Date(dto.rideTime) < new Date()) {
      throw new BadRequestException('Cannot create a ride in the past');
    }
    const updated = await this.rideModel.findByIdAndUpdate(id, dto, { new: true }).populate('driver passengers').exec();
    if (!updated) throw new NotFoundException('Ride not found');
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const ride = await this.rideModel.findById(id).exec();
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driver.toString() !== userId) {
      throw new ForbiddenException('You can only delete rides posted by you');
    }
    await this.rideModel.findByIdAndDelete(id).exec();
  }

  async bookSeat(rideId: string, userId: string): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId).exec();
    if (!ride) throw new NotFoundException('Ride not found');

    if (ride.seatsAvailable <= ride.passengers.length) {
      throw new Error('No seats available');
    }

    ride.passengers.push(new Types.ObjectId(userId));
    await ride.save();

    try {
      const joiner = await this.usersService.findOne(userId);
      const joinerName = joiner ? joiner.name : 'A passenger';
      
      const notification = await this.notificationsService.create({
        userId: ride.driver.toString(),
        title: 'Seat Booked!',
        message: `${joinerName} has booked a seat on your ride from ${ride.pickupLocation} to ${ride.dropLocation}.`,
        type: 'info',
      });

      // Push real-time notification via WebSocket
      this.notificationsGateway.sendToUser(ride.driver.toString(), 'new_notification', {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        createdAt: (notification as any).createdAt || new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to create booking notification:', e);
    }

    return ride.populate('driver passengers');
  }
}
