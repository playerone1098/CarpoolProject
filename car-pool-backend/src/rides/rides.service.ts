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

  async create(dto: CreateRideDto, userId?: string): Promise<Ride> {
    const driverId = userId || dto.driver;
    if (driverId) {
      try {
        const user = await this.usersService.findOne(driverId);
        if (user) {
          const isSeeker = user.role === 'seeker' || (!user.isCarOwner && user.role !== 'driver' && user.role !== 'giver');
          if (isSeeker) {
            throw new ForbiddenException('Ride seekers are not allowed to post rides. Only drivers/car owners can post rides.');
          }
        }
      } catch (e) {
        if (e instanceof ForbiddenException) throw e;
      }
    }

    const rideData: any = {
      ...dto,
      driver: driverId ? new Types.ObjectId(driverId) : undefined,
      driverName: dto.driverName || 'Community Driver',
      carModel: dto.carModel || 'Standard Sedan',
      title: dto.title || 'Commute Ride',
      seatsAvailable: dto.seatsAvailable || dto.availableSeats || 3,
      availableSeats: dto.availableSeats || dto.seatsAvailable || 3,
      pickupLocation: dto.pickupLocation || dto.pickup || 'Pickup Point',
      pickup: dto.pickup || dto.pickupLocation || 'Pickup Point',
      dropLocation: dto.dropLocation || dto.drop || dto.destination || 'Drop Location',
      drop: dto.drop || dto.dropLocation || dto.destination || 'Drop Location',
      destination: dto.destination || dto.dropLocation || dto.drop || 'Destination',
      time: dto.time || 'Scheduled',
      rideTime: dto.rideTime ? new Date(dto.rideTime) : new Date(),
    };

    if (dto.groupId && Types.ObjectId.isValid(dto.groupId)) {
      rideData.groupId = new Types.ObjectId(dto.groupId);
    }

    const ride = new this.rideModel(rideData);
    return ride.save();
  }

  async findAll(): Promise<Ride[]> {
    return this.rideModel
      .find()
      .populate('driver passengers')
      .exec();
  }

  async findByGroup(groupId: string): Promise<Ride[]> {
    if (!groupId || groupId === 'all' || !Types.ObjectId.isValid(groupId)) {
      return this.findAll();
    }
    return this.rideModel
      .find({ groupId: new Types.ObjectId(groupId) })
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
    if (dto.rideTime && new Date(dto.rideTime).getTime() < Date.now() - 5 * 60 * 1000) {
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

    const driverIdStr = ride.driver ? ride.driver.toString() : '';
    if (driverIdStr === userId) {
      throw new BadRequestException('You cannot book a seat on your own ride');
    }

    const isAlreadyPassenger = (ride.passengers || []).some(
      (p) => p.toString() === userId
    );
    if (isAlreadyPassenger) {
      throw new BadRequestException('You have already booked a seat on this ride');
    }

    const available = ride.availableSeats !== undefined ? ride.availableSeats : ride.seatsAvailable;
    if (available <= 0) {
      throw new BadRequestException('No available seats left on this ride');
    }

    ride.passengers.push(new Types.ObjectId(userId));
    if (ride.seatsAvailable > 0) ride.seatsAvailable -= 1;
    if (ride.availableSeats !== undefined && ride.availableSeats > 0) {
      ride.availableSeats -= 1;
    }
    await ride.save();

    try {
      const joiner = await this.usersService.findOne(userId);
      const joinerName = joiner ? joiner.name : 'A passenger';
      
      if (ride.driver) {
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
      }
    } catch (e) {
      console.error('Failed to create booking notification:', e);
    }

    return ride.populate('driver passengers');
  }
}
