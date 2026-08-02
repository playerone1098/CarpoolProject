import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ─── Haversine distance in KM between two lat/lng points ───
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

  // ─── Fetch driving route polyline from OSRM (free, no API key) ───
  private async fetchRouteGeometry(
    pickup: { lat: number; lng: number },
    drop: { lat: number; lng: number },
  ): Promise<number[][]> {
    try {
      // OSRM uses lng,lat order in the URL
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
        // GeoJSON coordinates are [lng, lat] — convert to [lat, lng] for our storage
        const coords: number[][] = data.routes[0].geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]],
        );
        // Downsample to max ~200 points to keep document size small
        if (coords.length > 200) {
          const step = Math.ceil(coords.length / 200);
          const sampled = coords.filter((_, i) => i % step === 0);
          // Always include the last point
          if (sampled[sampled.length - 1] !== coords[coords.length - 1]) {
            sampled.push(coords[coords.length - 1]);
          }
          return sampled;
        }
        return coords;
      }
    } catch (err) {
      this.logger.warn('Failed to fetch OSRM route, ride will not have en-route matching', err);
    }
    return [];
  }

  // ─── Geocode an address string to lat/lng using OpenStreetMap Nominatim ───
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

  // ─── Check if a point is within thresholdKm of any segment of a route polyline ───
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

    const rideData: any = {
      ...dto,
      driver: driverId ? new Types.ObjectId(driverId) : undefined,
      driverName: dto.driverName || 'Community Driver',
      carModel: dto.carModel || 'Standard Sedan',
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
      time: dto.time || 'Scheduled',
      rideTime: dto.rideTime ? new Date(dto.rideTime) : new Date(),
    };

    if (dto.groupId && Types.ObjectId.isValid(dto.groupId)) {
      rideData.groupId = new Types.ObjectId(dto.groupId);
    }

    // Fetch OSRM driving route if both pickup and drop coords are available
    if (pCoords && dCoords && !isNaN(pCoords.lat) && !isNaN(pCoords.lng) && !isNaN(dCoords.lat) && !isNaN(dCoords.lng)) {
      const routeGeometry = await this.fetchRouteGeometry(pCoords, dCoords);
      if (routeGeometry.length > 0) {
        rideData.routeGeometry = routeGeometry;
        this.logger.log(`Fetched OSRM route with ${routeGeometry.length} points for ride`);
      }
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

  // ─── En-Route Search: find rides where user's pickup/drop falls along the ride's route ───
  async searchEnRoute(
    userPickupLat?: number,
    userPickupLng?: number,
    userDropLat?: number,
    userDropLng?: number,
    thresholdKm = 3,
  ): Promise<Ride[]> {
    const allRides = await this.rideModel
      .find()
      .populate('driver passengers')
      .exec();

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
        // Check if user's pickup is near ride's pickup point
        if (ridePickup && this.getHaversineDistanceKm(userPickupLat, userPickupLng, ridePickup.lat, ridePickup.lng) <= thresholdKm) {
          pickupOnRoute = true;
        }
        // Check if user's pickup falls along the ride's driving route
        if (!pickupOnRoute && routeGeo && routeGeo.length > 0) {
          pickupOnRoute = this.isPointNearRoute(userPickupLat, userPickupLng, routeGeo, thresholdKm);
        }
      } else {
        pickupOnRoute = true; // No pickup filter = match all
      }

      if (hasUserDrop) {
        // Check if user's drop is near ride's drop point
        if (rideDrop && this.getHaversineDistanceKm(userDropLat, userDropLng, rideDrop.lat, rideDrop.lng) <= thresholdKm) {
          dropOnRoute = true;
        }
        // Check if user's drop falls along the ride's driving route
        if (!dropOnRoute && routeGeo && routeGeo.length > 0) {
          dropOnRoute = this.isPointNearRoute(userDropLat, userDropLng, routeGeo, thresholdKm);
        }
      } else {
        dropOnRoute = true; // No drop filter = match all
      }

      // For en-route matching: user's pickup must come before user's drop along the route direction
      if (pickupOnRoute && dropOnRoute && hasUserPickup && hasUserDrop && routeGeo && routeGeo.length > 1) {
        const pickupIdx = this.findClosestRouteIndex(userPickupLat, userPickupLng, routeGeo);
        const dropIdx = this.findClosestRouteIndex(userDropLat, userDropLng, routeGeo);
        // Ensure direction matches: pickup should be before drop in route order
        if (pickupIdx > dropIdx) {
          return false; // User wants to go in opposite direction of the ride
        }
      }

      return pickupOnRoute && dropOnRoute;
    });
  }

  // Find the index of the closest route point to a given coordinate
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

  // ─── Story 3.2: Live Vehicle Tracking & State Machine Methods ───

  async updateDriverLocation(
    rideId: string,
    locationData: { lat: number; lng: number; bearing?: number; speed?: number },
  ) {
    const ride = await this.rideModel.findById(rideId).exec();
    if (!ride) throw new NotFoundException('Ride not found');

    const updatedLoc = {
      lat: locationData.lat,
      lng: locationData.lng,
      bearing: locationData.bearing || 0,
      speed: locationData.speed || 0,
      updatedAt: new Date(),
    };

    ride.driverLocation = updatedLoc;
    await ride.save();

    // Broadcast location update over WebSocket channel
    this.notificationsGateway.broadcastToTrip(rideId, 'location_updated', {
      rideId,
      location: updatedLoc,
      tripState: ride.tripState || 'DRIVER_EN_ROUTE',
      timestamp: new Date().toISOString(),
    });

    return { ok: true, rideId, location: updatedLoc };
  }

  async updateTripState(rideId: string, tripState: string) {
    const validStates = ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_IN_PROGRESS', 'TRIP_COMPLETED'];
    if (!validStates.includes(tripState)) {
      throw new BadRequestException(`Invalid tripState: ${tripState}`);
    }

    const ride = await this.rideModel.findById(rideId).populate('driver passengers').exec();
    if (!ride) throw new NotFoundException('Ride not found');

    ride.tripState = tripState;
    if (tripState === 'TRIP_IN_PROGRESS' || tripState === 'TRIP_COMPLETED') {
      ride.status = tripState === 'TRIP_COMPLETED' ? 'completed' : 'ongoing';
    }
    await ride.save();

    // Broadcast state transition to room subscribers
    this.notificationsGateway.broadcastToTrip(rideId, 'trip_state_updated', {
      rideId,
      tripState,
      timestamp: new Date().toISOString(),
    });

    // If driver arrived, trigger high-priority push notification to all riders
    if (tripState === 'DRIVER_ARRIVED') {
      const driverName = (ride.driver as any)?.name || ride.driverName || 'Your driver';
      const passengers = ride.passengers || [];
      for (const passenger of passengers) {
        const pId = typeof passenger === 'object' ? (passenger as any)._id?.toString() : String(passenger);
        if (pId) {
          try {
            const notif = await this.notificationsService.create({
              userId: pId,
              title: 'Driver Arrived! 🚗',
              message: `Your driver ${driverName} has arrived at the pickup point!`,
              type: 'info',
            });
            this.notificationsGateway.sendToUser(pId, 'new_notification', {
              _id: notif._id,
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

    return ride;
  }

  async getRideTracking(rideId: string) {
    const ride = await this.rideModel.findById(rideId).populate('driver passengers').exec();
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
      await ride.save().catch(() => {});
    }

    const effectivePickupCoords = pCoords || { lat: 0, lng: 0 };
    const effectiveDropCoords = dCoords || { lat: 0, lng: 0 };

    const driverObj = (ride.driver as any) || {};
    const driverLocation = ride.driverLocation || {
      lat: effectivePickupCoords.lat,
      lng: effectivePickupCoords.lng,
      bearing: 0,
      speed: 0,
      updatedAt: new Date(),
    };

    // Compute active target pin and ETA based on current state
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
      rideId: ride._id,
      tripState: ride.tripState || 'DRIVER_EN_ROUTE',
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
        id: driverObj._id || ride.driver,
        name: driverName,
        phone: driverPhone,
        rating: driverRating,
        carModel: driverCarModel,
        licensePlate: driverLicensePlate,
        avatar: driverAvatar,
      },
      passengers: ride.passengers,
      etaMinutes,
      remainingDistanceKm: parseFloat(distKm.toFixed(1)),
    };
  }
}
