import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, startSession } from 'mongoose';
import { Trip, TripDocument } from './trip.schema';
import { TripRider, TripRiderDocument } from './trip-rider.schema';

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<TripDocument>,
    @InjectModel(TripRider.name) private tripRiderModel: Model<TripRiderDocument>,
  ) {}

  async findAll() {
    return this.tripModel.find().exec();
  }

  async findById(id: string) {
    return this.tripModel.findById(id).exec();
  }

  async create(createTripDto: any) {
    const createdTrip = new this.tripModel(createTripDto);
    return createdTrip.save();
  }

  async update(id: string, dto: any, userId: string) {
    const trip = await this.tripModel.findById(id).exec();
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.host_id && trip.host_id.toString() !== userId) {
      throw new ForbiddenException('You can only edit trips posted by you');
    }
    Object.assign(trip, dto);
    return trip.save();
  }

  async remove(id: string, userId: string) {
    const trip = await this.tripModel.findById(id).exec();
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.host_id && trip.host_id.toString() !== userId) {
      throw new ForbiddenException('You can only delete trips posted by you');
    }
    await this.tripModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  // Safe join using a session (transaction)
  async joinTrip(tripId: string, userId: string) {
    const session: ClientSession = await this.tripModel.db.startSession();
    session.startTransaction();
    try {
      // find trip and ensure seats_available > 0
      const trip = await this.tripModel.findOne({ _id: tripId, status: 'active' }).session(session);
      if (!trip) throw new NotFoundException('Trip not found');
      if (trip.seats_available <= 0) throw new BadRequestException('No seats available');

      // decrement seats
      trip.seats_available = trip.seats_available - 1;
      await trip.save({ session });

      // insert trip_rider
      await this.tripRiderModel.create([{ trip_id: tripId, user_id: userId }], { session });

      await session.commitTransaction();
      session.endSession();
      return { ok: true, tripId, userId };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
