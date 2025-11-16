import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ride } from './ride.schema';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';

@Injectable()
export class RidesService {
  constructor(@InjectModel(Ride.name) private rideModel: Model<Ride>) {}

  async create(dto: CreateRideDto): Promise<Ride> {
    const ride = new this.rideModel(dto);
    return ride.save();
  }

  async findAll(): Promise<Ride[]> {
    return this.rideModel.find().populate('driver passengers groupId').exec();
  }

  async findByGroup(groupId: string, sortBy?: string): Promise<Ride[]> {
    let sort: any = {};
    if (sortBy === 'time') sort = { rideTime: 1 };
    else if (sortBy === 'pickup') sort = { pickupLocation: 1 };
    else if (sortBy === 'drop') sort = { dropLocation: 1 };

    return this.rideModel
      .find({ groupId: new Types.ObjectId(groupId) })
      .populate('driver passengers')
      .sort(sort)
      .exec();
  }

  async findOne(id: string): Promise<Ride> {
    const ride = await this.rideModel.findById(id).populate('driver passengers').exec();
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  async update(id: string, dto: UpdateRideDto): Promise<Ride> {
    const ride = await this.rideModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  async remove(id: string): Promise<void> {
    const result = await this.rideModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Ride not found');
  }

  async bookSeat(rideId: string, userId: string): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId).exec();
    if (!ride) throw new NotFoundException('Ride not found');

    if (ride.seatsAvailable <= ride.passengers.length) {
      throw new Error('No seats available');
    }

    ride.passengers.push(new Types.ObjectId(userId));
    await ride.save();

    return ride.populate('driver passengers');
  }
}
