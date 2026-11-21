import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { TripRider } from './entities/trip-rider.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(TripRider) private readonly tripRiderRepo: Repository<TripRider>,
    private readonly dataSource: DataSource,
  ) {}

  private normalizeTrip(trip: Trip): Trip {
    if (!trip) return trip;
    trip._id = trip.id;
    if (trip.host) {
      trip.host._id = trip.host.id;
    }
    return trip;
  }

  async findAll(): Promise<Trip[]> {
    const trips = await this.tripRepo.find({ relations: ['host'] });
    return trips.map((t) => this.normalizeTrip(t));
  }

  async findById(id: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: [{ id }, { _id: id }],
      relations: ['host'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return this.normalizeTrip(trip);
  }

  async create(createTripDto: any): Promise<Trip> {
    const trip = this.tripRepo.create(createTripDto as Partial<Trip>);
    const saved = await this.tripRepo.save(trip);
    return this.normalizeTrip(saved);
  }

  async update(id: string, dto: any, userId: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: [{ id }, { _id: id }],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.host_id && trip.host_id !== userId) {
      throw new ForbiddenException('You can only edit trips posted by you');
    }
    Object.assign(trip, dto);
    const saved = await this.tripRepo.save(trip);
    return this.normalizeTrip(saved);
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    const trip = await this.tripRepo.findOne({
      where: [{ id }, { _id: id }],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.host_id && trip.host_id !== userId) {
      throw new ForbiddenException('You can only delete trips posted by you');
    }
    await this.tripRepo.delete(trip.id);
    return { deleted: true };
  }

  async joinTrip(tripId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(Trip, {
        where: [{ id: tripId }, { _id: tripId }],
      });
      if (!trip) throw new NotFoundException('Trip not found');
      if (trip.seats_available <= 0) throw new BadRequestException('No seats available');

      trip.seats_available -= 1;
      await manager.save(Trip, trip);

      const tripRider = manager.create(TripRider, {
        trip_id: trip.id,
        user_id: userId,
      });
      await manager.save(TripRider, tripRider);

      return { ok: true, tripId: trip.id, userId };
    });
  }
}
