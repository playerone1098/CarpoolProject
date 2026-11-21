import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride } from './entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private normalizeRide(ride: Ride): Ride {
    if (!ride) return ride;
    ride._id = ride.id;
    if (ride.driver) {
      ride.driver._id = ride.driver.id;
    }
    if (ride.passengers && Array.isArray(ride.passengers)) {
      ride.passengers.forEach((p) => {
        if (p) p._id = p.id;
      });
    }
    return ride;
  }

  private getHaversineDistanceKm(
    lat1: number, lon1: number, lat2: number, lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async fetchRouteGeometry(
    pickup: { lat: number; lng: number },
    drop: { lat: number; lng: number },
  ): Promise<number[][]> {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}` +
        `?overview=full&geometries=geojson`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'CarPoolApp/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();

      if (data?.routes?.[0]?.geometry?.coordinates) {
        const coords: number[][] = data.routes[0].geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]],
        );
        if (coords.length > 200) {
          const step = Math.ceil(coords.length / 200);
          const sampled = coords.filter((_, i) => i % step === 0);
          if (sampled[sampled.length - 1] !== coords[coords.length - 1]) {
            sampled.push(coords[coords.length - 1]);
          }
          return sampled;
        }
        return coords;
      }
    } catch (err) {
      this.logger.warn('Failed to fetch OSRM route, ride will not have en-route matching');
    }
    return [];
  }

  private async geocodeLocation(address: string): Promise<{ lat: number; lng: number } | undefined> {
    if (!address || address.trim().length === 0 || address === 'Pickup Point' || address === 'Drop Location') {
      return undefined;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CarPoolApp/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      if (data && data.length > 0 && data[0].lat && data[0].lon) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (e) {
      this.logger.warn(`Failed to geocode address "${address}":`, e);
    }
    return undefined;
  }

  private isPointNearRoute(
    pointLat: number,
    pointLng: number,
    routeGeometry: number[][],
    thresholdKm: number,
  ): boolean {
    if (!routeGeometry || routeGeometry.length === 0) return false;
    for (const coord of routeGeometry) {
      const dist = this.getHaversineDistanceKm(pointLat, pointLng, coord[0], coord[1]);
      if (dist <= thresholdKm) return true;
    }
    return false;
  }

  async create(dto: CreateRideDto, userId?: string): Promise<Ride> {
    const driverId = userId || dto.driver;
    let driverUser: User | null = null;

    if (driverId) {
      try {
        driverUser = await this.userRepo.findOne({
          where: [{ id: driverId }, { _id: driverId }],
        });
        if (driverUser) {
          const isSeeker =
            driverUser.role === 'seeker' ||
            (!driverUser.isCarOwner && driverUser.role !== 'driver' && driverUser.role !== 'giver');
          if (isSeeker) {
            throw new ForbiddenException('Ride seekers are not allowed to post rides. Only drivers/car owners can post rides.');
          }
        }
      } catch (e) {
        if (e instanceof ForbiddenException) throw e;
      }
    }

    const pickupText = dto.pickupLocation || dto.pickup || 'Pickup Point';
    const dropText = dto.dropLocation || dto.drop || dto.destination || 'Drop Location';

    let pCoords = dto.pickupCoords;
    let dCoords = dto.dropCoords;

    if ((!pCoords || isNaN(pCoords.lat) || isNaN(pCoords.lng)) && pickupText) {
      pCoords = await this.geocodeLocation(pickupText);
    }
    if ((!dCoords || isNaN(dCoords.lat) || isNaN(dCoords.lng)) && dropText) {
      dCoords = await this.geocodeLocation(dropText);
    }

    let routeGeometry: number[][] = [];
    if (pCoords && dCoords && !isNaN(pCoords.lat) && !isNaN(pCoords.lng) && !isNaN(dCoords.lat) && !isNaN(dCoords.lng)) {
      routeGeometry = await this.fetchRouteGeometry(pCoords, dCoords);
    }

    const ride = this.rideRepo.create({
      driver: driverUser || undefined,
      driverId: driverUser ? driverUser.id : driverId,
      driverName: dto.driverName || driverUser?.name || 'Community Driver',
      carModel: dto.carModel || driverUser?.carInfo?.model || 'Standard Sedan',
      title: dto.title || 'Commute Ride',
      seatsAvailable: dto.seatsAvailable || dto.availableSeats || 3,
      availableSeats: dto.availableSeats || dto.seatsAvailable || 3,
      pickupLocation: pickupText,
      pickup: pickupText,
      dropLocation: dropText,
      drop: dropText,
      destination: dropText,
      pickupCoords: pCoords,
      dropCoords: dCoords,
      routeGeometry: routeGeometry.length > 0 ? routeGeometry : undefined,
      time: dto.time || 'Scheduled',
      rideTime: dto.rideTime ? new Date(dto.rideTime) : new Date(),
      groupId: dto.groupId,
      price: dto.price || 0,
      passengers: [],
      status: 'scheduled',
      tripState: 'SCHEDULED',
      licensePlate: (dto as any).licensePlate || driverUser?.carInfo?.plateNumber,
      driverPhone: (dto as any).driverPhone || driverUser?.phone,
      driverRating: driverUser?.rating || 5.0,
    });

    const saved = await this.rideRepo.save(ride);
    return this.normalizeRide(saved);
  }

  async findAll(): Promise<Ride[]> {
    const rides = await this.rideRepo.find({
      relations: ['driver', 'passengers'],
    });
    return rides.map((r) => this.normalizeRide(r));
  }

  async searchEnRoute(
    userPickupLat?: number,
    userPickupLng?: number,
    userDropLat?: number,
    userDropLng?: number,
    thresholdKm = 3,
  ): Promise<Ride[]> {
    const allRides = await this.findAll();

    const hasUserPickup = userPickupLat !== undefined && userPickupLng !== undefined
      && !isNaN(userPickupLat) && !isNaN(userPickupLng);
    const hasUserDrop = userDropLat !== undefined && userDropLng !== undefined
      && !isNaN(userDropLat) && !isNaN(userDropLng);

    if (!hasUserPickup && !hasUserDrop) return allRides;

    return allRides.filter((ride) => {
      const routeGeo = ride.routeGeometry;
      const ridePickup = ride.pickupCoords;
      const rideDrop = ride.dropCoords;

      let pickupOnRoute = false;
      let dropOnRoute = false;

      if (hasUserPickup) {
        if (ridePickup && this.getHaversineDistanceKm(userPickupLat, userPickupLng, ridePickup.lat, ridePickup.lng) <= thresholdKm) {
          pickupOnRoute = true;
        }
        if (!pickupOnRoute && routeGeo && routeGeo.length > 0) {
          pickupOnRoute = this.isPointNearRoute(userPickupLat, userPickupLng, routeGeo, thresholdKm);
        }
      } else {
        pickupOnRoute = true;
      }

      if (hasUserDrop) {
        if (rideDrop && this.getHaversineDistanceKm(userDropLat, userDropLng, rideDrop.lat, rideDrop.lng) <= thresholdKm) {
          dropOnRoute = true;
        }
        if (!dropOnRoute && routeGeo && routeGeo.length > 0) {
          dropOnRoute = this.isPointNearRoute(userDropLat, userDropLng, routeGeo, thresholdKm);
        }
      } else {
        dropOnRoute = true;
      }

      if (pickupOnRoute && dropOnRoute && hasUserPickup && hasUserDrop && routeGeo && routeGeo.length > 1) {
        const pickupIdx = this.findClosestRouteIndex(userPickupLat, userPickupLng, routeGeo);
        const dropIdx = this.findClosestRouteIndex(userDropLat, userDropLng, routeGeo);
        if (pickupIdx > dropIdx) {
          return false;
        }
      }

      return pickupOnRoute && dropOnRoute;
    });
  }

  private findClosestRouteIndex(lat: number, lng: number, routeGeo: number[][]): number {
    let minDist = Infinity;
    let minIdx = 0;
    for (let i = 0; i < routeGeo.length; i++) {
      const dist = this.getHaversineDistanceKm(lat, lng, routeGeo[i][0], routeGeo[i][1]);
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }
    return minIdx;
  }

  async findByGroup(groupId: string): Promise<Ride[]> {
    if (!groupId || groupId === 'all') {
      return this.findAll();
    }
    const rides = await this.rideRepo.find({
      where: { groupId },
      relations: ['driver', 'passengers'],
    });
    return rides.map((r) => this.normalizeRide(r));
  }

  async findUserHistory(userId: string): Promise<Ride[]> {
    const allRides = await this.rideRepo.find({
      relations: ['driver', 'passengers'],
    });

    const userRides = allRides.filter((ride) => {
      const isDriver =
        ride.driverId === userId ||
        ride.driver?.id === userId ||
        ride.driver?._id === userId;

      const isPassenger = (ride.passengers || []).some(
        (p) => p.id === userId || p._id === userId,
      );

      return isDriver || isPassenger;
    });

    return userRides.map((r) => this.normalizeRide(r));
  }

  async findOne(id: string): Promise<Ride> {
    const ride = await this.rideRepo.findOne({
      where: [{ id }, { _id: id }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) throw new NotFoundException('Ride not found');
    return this.normalizeRide(ride);
  }

  async update(id: string, dto: UpdateRideDto, userId: string): Promise<Ride> {
    const ride = await this.rideRepo.findOne({
      where: [{ id }, { _id: id }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const driverId = ride.driverId || ride.driver?.id;
    if (driverId !== userId) {
      throw new ForbiddenException('You can only edit rides posted by you');
    }
    if (dto.rideTime && new Date(dto.rideTime).getTime() < Date.now() - 5 * 60 * 1000) {
      throw new BadRequestException('Cannot create a ride in the past');
    }

    Object.assign(ride, dto);
    const updated = await this.rideRepo.save(ride);
    return this.normalizeRide(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const ride = await this.rideRepo.findOne({
      where: [{ id }, { _id: id }],
      relations: ['driver'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const driverId = ride.driverId || ride.driver?.id;
    if (driverId !== userId) {
      throw new ForbiddenException('You can only delete rides posted by you');
    }
    await this.rideRepo.delete(ride.id);
  }

  async bookSeat(rideId: string, userId: string): Promise<Ride> {
    const ride = await this.rideRepo.findOne({
      where: [{ id: rideId }, { _id: rideId }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const driverId = ride.driverId || ride.driver?.id;
    if (driverId === userId) {
      throw new BadRequestException('You cannot book a seat on your own ride');
    }

    const isAlreadyPassenger = (ride.passengers || []).some(
      (p) => p.id === userId || p._id === userId,
    );
    if (isAlreadyPassenger) {
      throw new BadRequestException('You have already booked a seat on this ride');
    }

    const available = ride.availableSeats !== undefined ? ride.availableSeats : ride.seatsAvailable;
    if (available <= 0) {
      throw new BadRequestException('No available seats left on this ride');
    }

    const passenger = await this.userRepo.findOne({
      where: [{ id: userId }, { _id: userId }],
    });
    if (!passenger) throw new NotFoundException('Passenger user not found');

    ride.passengers = ride.passengers || [];
    ride.passengers.push(passenger);

    if (ride.seatsAvailable > 0) ride.seatsAvailable -= 1;
    if (ride.availableSeats !== undefined && ride.availableSeats > 0) {
      ride.availableSeats -= 1;
    }

    const saved = await this.rideRepo.save(ride);

    try {
      if (ride.driverId || ride.driver) {
        const dId = ride.driverId || ride.driver.id;
        const notification = await this.notificationsService.create({
          userId: dId,
          title: 'Seat Booked!',
          message: `${passenger.name} has booked a seat on your ride from ${ride.pickupLocation} to ${ride.dropLocation}.`,
          type: 'info',
        });

        this.notificationsGateway.sendToUser(dId, 'new_notification', {
          _id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: false,
          createdAt: notification.createdAt?.toISOString() || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Failed to create booking notification:', e);
    }

    return this.normalizeRide(saved);
  }

  async updateDriverLocation(
    rideId: string,
    locationData: { lat: number; lng: number; bearing?: number; speed?: number },
  ) {
    const ride = await this.rideRepo.findOne({
      where: [{ id: rideId }, { _id: rideId }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const updatedLoc = {
      lat: locationData.lat,
      lng: locationData.lng,
      bearing: locationData.bearing || 0,
      speed: locationData.speed || 0,
      updatedAt: new Date(),
    };

    ride.driverLocation = updatedLoc;

    let dropCoords = ride.dropCoords;
    if ((!dropCoords || isNaN(dropCoords.lat) || isNaN(dropCoords.lng)) && (ride.dropLocation || ride.destination || ride.drop)) {
      const dropText = ride.dropLocation || ride.destination || ride.drop || '';
      dropCoords = await this.geocodeLocation(dropText);
      if (dropCoords) {
        ride.dropCoords = dropCoords;
      }
    }

    let autoCompleted = false;
    let distanceMeters = 0;

    if (dropCoords && typeof dropCoords.lat === 'number' && typeof dropCoords.lng === 'number' && !isNaN(dropCoords.lat) && !isNaN(dropCoords.lng) && ride.tripState !== 'TRIP_COMPLETED') {
      const distanceKm = this.getHaversineDistanceKm(
        locationData.lat,
        locationData.lng,
        dropCoords.lat,
        dropCoords.lng,
      );
      distanceMeters = Math.round(distanceKm * 1000);

      if (distanceKm <= 0.1) {
        ride.tripState = 'TRIP_COMPLETED';
        ride.status = 'completed';
        autoCompleted = true;
        this.logger.log(`Ride ${rideId} auto-completed: driver reached within ${distanceMeters}m of destination.`);

        this.notificationsGateway.broadcastToTrip(rideId, 'trip_state_updated', {
          rideId,
          tripState: 'TRIP_COMPLETED',
          timestamp: new Date().toISOString(),
          autoCompleted: true,
          distanceMeters,
        });
      }
    }

    await this.rideRepo.save(ride);

    this.notificationsGateway.broadcastToTrip(rideId, 'location_updated', {
      rideId,
      location: updatedLoc,
      tripState: ride.tripState || 'SCHEDULED',
      timestamp: new Date().toISOString(),
      autoCompleted,
      distanceMeters,
    });

    return {
      ok: true,
      rideId,
      location: updatedLoc,
      tripState: ride.tripState || 'SCHEDULED',
      status: ride.status || 'scheduled',
      autoCompleted,
      distanceMeters,
    };
  }

  async updateTripState(rideId: string, tripState: string) {
    const validStates = ['SCHEDULED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_IN_PROGRESS', 'TRIP_COMPLETED'];
    if (!validStates.includes(tripState)) {
      throw new BadRequestException(`Invalid tripState: ${tripState}`);
    }

    const ride = await this.rideRepo.findOne({
      where: [{ id: rideId }, { _id: rideId }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    ride.tripState = tripState;
    if (tripState === 'TRIP_IN_PROGRESS' || tripState === 'TRIP_COMPLETED') {
      ride.status = tripState === 'TRIP_COMPLETED' ? 'completed' : 'ongoing';
    }
    await this.rideRepo.save(ride);

    this.notificationsGateway.broadcastToTrip(rideId, 'trip_state_updated', {
      rideId,
      tripState,
      timestamp: new Date().toISOString(),
    });

    if (tripState === 'DRIVER_ARRIVED') {
      const driverName = ride.driver?.name || ride.driverName || 'Your driver';
      const passengers = ride.passengers || [];
      for (const passenger of passengers) {
        const pId = passenger.id;
        if (pId) {
          try {
            const notif = await this.notificationsService.create({
              userId: pId,
              title: 'Driver Arrived! 🚗',
              message: `Your driver ${driverName} has arrived at the pickup point!`,
              type: 'info',
            });
            this.notificationsGateway.sendToUser(pId, 'new_notification', {
              _id: notif.id,
              title: notif.title,
              message: notif.message,
              type: notif.type,
              read: false,
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            this.logger.error('Failed to notify rider of arrival:', e);
          }
        }
      }
    }

    return this.normalizeRide(ride);
  }

  async getRideTracking(rideId: string) {
    const ride = await this.rideRepo.findOne({
      where: [{ id: rideId }, { _id: rideId }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const pickupText = ride.pickupLocation || ride.pickup || 'Pickup Point';
    const dropText = ride.dropLocation || ride.drop || ride.destination || 'Drop Location';

    let pCoords = ride.pickupCoords;
    let dCoords = ride.dropCoords;
    let modified = false;

    if ((!pCoords || isNaN(pCoords.lat) || isNaN(pCoords.lng)) && pickupText) {
      const geocodedP = await this.geocodeLocation(pickupText);
      if (geocodedP) {
        pCoords = geocodedP;
        ride.pickupCoords = pCoords;
        modified = true;
      }
    }

    if ((!dCoords || isNaN(dCoords.lat) || isNaN(dCoords.lng)) && dropText) {
      const geocodedD = await this.geocodeLocation(dropText);
      if (geocodedD) {
        dCoords = geocodedD;
        ride.dropCoords = dCoords;
        modified = true;
      }
    }

    let routeGeo = ride.routeGeometry || [];
    if (
      (!routeGeo || routeGeo.length === 0) &&
      pCoords &&
      dCoords &&
      !isNaN(pCoords.lat) &&
      !isNaN(pCoords.lng) &&
      !isNaN(dCoords.lat) &&
      !isNaN(dCoords.lng)
    ) {
      const fetchedPoly = await this.fetchRouteGeometry(pCoords, dCoords);
      if (fetchedPoly && fetchedPoly.length > 0) {
        routeGeo = fetchedPoly;
        ride.routeGeometry = routeGeo;
        modified = true;
      }
    }

    if (modified) {
      await this.rideRepo.save(ride).catch(() => {});
    }

    const effectivePickupCoords = pCoords || { lat: 0, lng: 0 };
    const effectiveDropCoords = dCoords || { lat: 0, lng: 0 };

    const driverObj = ride.driver || ({} as any);
    const driverLocation = ride.driverLocation || {
      lat: effectivePickupCoords.lat,
      lng: effectivePickupCoords.lng,
      bearing: 0,
      speed: 0,
      updatedAt: new Date(),
    };

    const targetCoords = ride.tripState === 'TRIP_IN_PROGRESS'
      ? effectiveDropCoords
      : effectivePickupCoords;

    const distKm = this.getHaversineDistanceKm(
      driverLocation.lat,
      driverLocation.lng,
      targetCoords.lat,
      targetCoords.lng,
    );

    const speedKmH = driverLocation.speed && driverLocation.speed > 5 ? driverLocation.speed : 30;
    const etaMinutes = Math.max(1, Math.round((distKm / speedKmH) * 60));

    const driverName = driverObj.name || ride.driverName || '';
    const driverPhone = driverObj.phone || ride.driverPhone || '';
    const driverRating = driverObj.rating ?? ride.driverRating ?? 0.0;
    const driverCarModel = driverObj.carInfo?.model || ride.carModel || '';
    const driverLicensePlate = driverObj.carInfo?.plateNumber || ride.licensePlate || '';
    const driverAvatar = driverObj.profilePhoto || '';

    return {
      rideId: ride.id,
      _id: ride.id,
      tripState: ride.tripState || 'SCHEDULED',
      status: ride.status || 'scheduled',
      driverLocation,
      pickupLocation: pickupText,
      pickupCoords: effectivePickupCoords,
      dropLocation: dropText,
      dropCoords: effectiveDropCoords,
      routeGeometry: routeGeo,
      price: ride.price ?? 0,
      seatsAvailable: ride.seatsAvailable,
      driver: {
        id: driverObj.id || ride.driverId,
        _id: driverObj.id || ride.driverId,
        name: driverName,
        phone: driverPhone,
        rating: driverRating,
        carModel: driverCarModel,
        licensePlate: driverLicensePlate,
        avatar: driverAvatar,
      },
      passengers: (ride.passengers || []).map((p) => ({
        id: p.id,
        _id: p.id,
        name: p.name,
        phone: p.phone,
      })),
      etaMinutes,
      remainingDistanceKm: parseFloat(distKm.toFixed(1)),
    };
  }
}
