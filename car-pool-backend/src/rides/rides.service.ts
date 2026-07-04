import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    return this.rideModel
      .find({ rideTime: { $gte: new Date() } })
      .populate('driver passengers groupId')
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

    return this.rideModel.populate(rawRides, { path: 'driver passengers groupId' }) as unknown as Ride[];
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

  async update(id: string, dto: UpdateRideDto, userId: string): Promise<Ride> {
    const ride = await this.rideModel.findById(id).exec();
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driver.toString() !== userId) {
      throw new ForbiddenException('You can only edit rides posted by you');
    }
    const updated = await this.rideModel.findByIdAndUpdate(id, dto, { new: true }).populate('driver passengers groupId').exec();
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

    return ride.populate('driver passengers');
  }
}
