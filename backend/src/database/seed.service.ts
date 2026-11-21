import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Bookmark } from '../users/entities/bookmark.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TripRider } from '../trips/entities/trip-rider.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Ledger } from '../payments/entities/ledger.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { AdminTicket } from '../ratings/entities/admin-ticket.entity';
import { ChatMessage } from '../chat/entities/chat.entity';
import { Group } from '../groups/entities/group.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Bookmark) private readonly bookmarkRepo: Repository<Bookmark>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(TripRider) private readonly tripRiderRepo: Repository<TripRider>,
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Ledger) private readonly ledgerRepo: Repository<Ledger>,
    @InjectRepository(Rating) private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(AdminTicket) private readonly adminTicketRepo: Repository<AdminTicket>,
    @InjectRepository(ChatMessage) private readonly chatRepo: Repository<ChatMessage>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
  ) {}

  async onApplicationBootstrap() {
    const autoSeed = process.env.AUTO_SEED !== 'false';
    if (autoSeed) {
      try {
        const userCount = await this.userRepo.count();
        if (userCount === 0) {
          this.logger.log('🌱 No existing data found in PostgreSQL database. Seeding initial local mock data...');
          await this.seedAll();
          this.logger.log('✅ Offline local mock data seeded successfully into PostgreSQL!');
        } else {
          this.logger.log(`ℹ️ Database already contains ${userCount} users. Auto-seed skipped.`);
        }
      } catch (err: any) {
        this.logger.warn(`Could not check/run auto-seed: ${err?.message || err}`);
      }
    }
  }

  async seedAll(): Promise<void> {
    const existing = await this.userRepo.findOne({ where: { phone: '9876543210' } });
    if (existing) {
      this.logger.log('ℹ️ Mock data already seeded. Skipping duplicate seed.');
      return;
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    // ─── 1. SEED USERS ───
    const alex = this.userRepo.create({
      phone: '9876543210',
      name: 'Alex Rivera',
      gender: 'male',
      email: 'alex.rivera@example.com',
      password: passwordHash,
      mode: 'pro',
      role: 'driver',
      isCarOwner: true,
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      carInfo: {
        model: 'Toyota Camry Hybrid (Silver)',
        color: 'Silver',
        plateNumber: 'KA-01-EQ-4421',
      },
      homeAddress: {
        address: 'HSR Layout Sector 2, Bangalore',
        coords: { lat: 12.9121, lng: 77.6446 },
      },
      workAddress: {
        address: 'Electronic City Phase 1, Bangalore',
        coords: { lat: 12.8452, lng: 77.6602 },
      },
      rating: 4.95,
      ratingCount: 42,
      recentRatings: [5, 5, 5, 4, 5, 5, 5, 5, 4, 5],
      walletBalance: 1500,
      payoutBalance: 4250,
    });
    await this.userRepo.save(alex);

    const sarah = this.userRepo.create({
      phone: '9876543211',
      name: 'Sarah Chen',
      gender: 'female',
      email: 'sarah.chen@example.com',
      password: passwordHash,
      mode: 'pro',
      role: 'driver',
      isCarOwner: true,
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      carInfo: {
        model: 'Honda Civic (Midnight Blue)',
        color: 'Blue',
        plateNumber: 'KA-03-MG-8890',
      },
      homeAddress: {
        address: 'Indiranagar 100ft Road, Bangalore',
        coords: { lat: 12.9719, lng: 77.6412 },
      },
      workAddress: {
        address: 'Manyata Tech Park, Bangalore',
        coords: { lat: 13.0475, lng: 77.6200 },
      },
      rating: 4.88,
      ratingCount: 31,
      recentRatings: [5, 4, 5, 5, 5, 5, 4, 5],
      walletBalance: 900,
      payoutBalance: 3100,
    });
    await this.userRepo.save(sarah);

    const priya = this.userRepo.create({
      phone: '9876543212',
      name: 'Priya Sharma',
      gender: 'female',
      email: 'priya.sharma@example.com',
      password: passwordHash,
      mode: 'free',
      role: 'seeker',
      isCarOwner: false,
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      homeAddress: {
        address: 'Koramangala 4th Block, Bangalore',
        coords: { lat: 12.9340, lng: 77.6227 },
      },
      workAddress: {
        address: 'Bagmane Tech Park, CV Raman Nagar',
        coords: { lat: 12.9818, lng: 77.6631 },
      },
      rating: 5.0,
      ratingCount: 18,
      recentRatings: [5, 5, 5, 5, 5],
      walletBalance: 850,
      payoutBalance: 0,
    });
    await this.userRepo.save(priya);

    const david = this.userRepo.create({
      phone: '9876543213',
      name: 'David Miller',
      gender: 'male',
      email: 'david.miller@example.com',
      password: passwordHash,
      mode: 'free',
      role: 'seeker',
      isCarOwner: false,
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      homeAddress: {
        address: 'MG Road Metro Station, Bangalore',
        coords: { lat: 12.9756, lng: 77.6066 },
      },
      workAddress: {
        address: 'Kempegowda International Airport (BLR)',
        coords: { lat: 13.1986, lng: 77.7066 },
      },
      rating: 4.90,
      ratingCount: 12,
      recentRatings: [5, 5, 4, 5, 5],
      walletBalance: 400,
      payoutBalance: 0,
    });
    await this.userRepo.save(david);

    const admin = this.userRepo.create({
      phone: '9876543214',
      name: 'Admin Demo',
      gender: 'unspecified',
      email: 'admin@carpool.local',
      password: passwordHash,
      mode: 'pro',
      role: 'giver',
      isCarOwner: true,
      rating: 5.0,
      ratingCount: 50,
      walletBalance: 5000,
      payoutBalance: 12000,
    });
    await this.userRepo.save(admin);

    // ─── 2. SEED BOOKMARKS ───
    const bm1 = this.bookmarkRepo.create({
      user_id: priya.id,
      label: 'Home',
      address: 'Koramangala 4th Block, Bangalore',
      latitude: 12.9340,
      longitude: 77.6227,
    });
    const bm2 = this.bookmarkRepo.create({
      user_id: priya.id,
      label: 'Office',
      address: 'Bagmane Tech Park, CV Raman Nagar',
      latitude: 12.9818,
      longitude: 77.6631,
    });
    await this.bookmarkRepo.save([bm1, bm2]);

    // ─── 3. SEED RIDES ───
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const inTwoHours = new Date(Date.now() + 2 * 3600 * 1000);

    const ride1 = this.rideRepo.create({
      driver: alex,
      driverId: alex.id,
      driverName: alex.name,
      carModel: alex.carInfo?.model || 'Toyota Camry Hybrid',
      title: 'Morning Tech Corridor Commute',
      seatsAvailable: 2,
      availableSeats: 2,
      pickupLocation: 'HSR Layout BDA Complex',
      pickup: 'HSR Layout BDA Complex',
      dropLocation: 'Electronic City Phase 1 Main Gate',
      drop: 'Electronic City Phase 1 Main Gate',
      destination: 'Electronic City Phase 1 Main Gate',
      rideTime: tomorrow,
      time: '08:30 AM',
      price: 150,
      pickupCoords: { lat: 12.9121, lng: 77.6446 },
      dropCoords: { lat: 12.8452, lng: 77.6602 },
      routeGeometry: [
        [12.9121, 77.6446],
        [12.8900, 77.6500],
        [12.8650, 77.6550],
        [12.8452, 77.6602],
      ],
      passengers: [priya],
      status: 'scheduled',
      tripState: 'SCHEDULED',
      licensePlate: 'KA-01-EQ-4421',
      driverRating: 4.95,
      driverPhone: alex.phone,
    });

    const ride2 = this.rideRepo.create({
      driver: sarah,
      driverId: sarah.id,
      driverName: sarah.name,
      carModel: sarah.carInfo?.model || 'Honda Civic',
      title: 'Airport Live Express Carpool',
      seatsAvailable: 1,
      availableSeats: 1,
      pickupLocation: 'Indiranagar 100ft Road',
      pickup: 'Indiranagar 100ft Road',
      dropLocation: 'Kempegowda International Airport (BLR)',
      drop: 'Kempegowda International Airport (BLR)',
      destination: 'Kempegowda International Airport (BLR)',
      rideTime: inTwoHours,
      time: 'Live Now',
      price: 320,
      pickupCoords: { lat: 12.9719, lng: 77.6412 },
      dropCoords: { lat: 13.1986, lng: 77.7066 },
      driverLocation: {
        lat: 13.0020,
        lng: 77.6550,
        bearing: 35,
        speed: 45,
        updatedAt: new Date(),
      },
      routeGeometry: [
        [12.9719, 77.6412],
        [13.0100, 77.6600],
        [13.1000, 77.6850],
        [13.1986, 77.7066],
      ],
      passengers: [david],
      status: 'ongoing',
      tripState: 'DRIVER_EN_ROUTE',
      licensePlate: 'KA-03-MG-8890',
      driverRating: 4.88,
      driverPhone: sarah.phone,
    });

    const ride3 = this.rideRepo.create({
      driver: alex,
      driverId: alex.id,
      driverName: alex.name,
      carModel: 'Toyota Camry Hybrid',
      title: 'Evening Return Commute',
      seatsAvailable: 3,
      availableSeats: 3,
      pickupLocation: 'Electronic City Toll Gate',
      pickup: 'Electronic City Toll Gate',
      dropLocation: 'Koramangala Sony World Signal',
      drop: 'Koramangala Sony World Signal',
      destination: 'Koramangala Sony World Signal',
      rideTime: new Date(Date.now() + 30 * 3600 * 1000),
      time: '06:15 PM',
      price: 130,
      pickupCoords: { lat: 12.8452, lng: 77.6602 },
      dropCoords: { lat: 12.9340, lng: 77.6227 },
      passengers: [],
      status: 'scheduled',
      tripState: 'SCHEDULED',
      licensePlate: 'KA-01-EQ-4421',
      driverRating: 4.95,
      driverPhone: alex.phone,
    });

    await this.rideRepo.save([ride1, ride2, ride3]);

    // ─── 4. SEED TRIPS & TRIP RIDERS ───
    const trip1 = this.tripRepo.create({
      host_id: alex.id,
      host: alex,
      title: 'Daily Tech Park Shuttle',
      start_time: tomorrow,
      origin: { name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
      destination: { name: 'Electronic City Phase 1', lat: 12.8452, lng: 77.6602 },
      seats_total: 4,
      seats_available: 3,
      status: 'active',
    });
    await this.tripRepo.save(trip1);

    const tripRider = this.tripRiderRepo.create({
      trip_id: trip1.id,
      user_id: priya.id,
      trip: trip1,
      user: priya,
    });
    await this.tripRiderRepo.save(tripRider);

    // ─── 5. SEED GROUPS & CHATS ───
    const group1 = this.groupRepo.create({
      name: 'Tech Park Daily Commuters',
      description: 'Daily carpool group for folks traveling between Koramangala/HSR and Electronic City.',
      icon: '🚗',
      createdById: alex.id,
      createdBy: alex,
      members: [alex, priya, david],
    });

    const group2 = this.groupRepo.create({
      name: 'BLR Airport Travelers Club',
      description: 'Cost-effective ride shares to Kempegowda International Airport.',
      icon: '✈️',
      createdById: sarah.id,
      createdBy: sarah,
      members: [sarah, david],
    });
    await this.groupRepo.save([group1, group2]);

    const chat1 = this.chatRepo.create({
      rideId: ride1.id,
      senderId: priya.id,
      senderName: priya.name,
      receiverId: alex.id,
      text: 'Hi Alex! I booked a seat for tomorrow morning. Should I wait near the main gate?',
    });
    const chat2 = this.chatRepo.create({
      rideId: ride1.id,
      senderId: alex.id,
      senderName: alex.name,
      receiverId: priya.id,
      text: 'Hi Priya! Yes, right by the main gate works perfectly. I will see you at 8:30 AM!',
    });
    await this.chatRepo.save([chat1, chat2]);

    // ─── 6. SEED PAYMENTS & LEDGERS ───
    const paymentHold = this.paymentRepo.create({
      rideId: ride1.id,
      ride: ride1,
      riderId: priya.id,
      rider: priya,
      driverId: alex.id,
      driver: alex,
      amount: 150,
      seats: 1,
      paymentMethod: 'wallet',
      status: 'hold',
      platformFee: 15,
      driverEarnings: 135,
      transactionId: `TXN-${Date.now()}-8821`,
    });
    await this.paymentRepo.save(paymentHold);

    const ledgerRider = this.ledgerRepo.create({
      userId: priya.id,
      user: priya,
      paymentId: paymentHold.id,
      rideId: ride1.id,
      type: 'debit',
      grossAmount: 150,
      platformFee: 0,
      netAmount: 150,
      paymentMethod: 'wallet',
      description: 'Pre-ride fare hold for Electronic City commute',
    });
    await this.ledgerRepo.save(ledgerRider);

    // ─── 7. SEED RATINGS ───
    const rating1 = this.ratingRepo.create({
      rideId: ride1.id,
      ride: ride1,
      reviewerId: priya.id,
      revieweeId: alex.id,
      rating: 5,
      tags: ['Smooth Driving', 'Clean Car', 'Punctual'],
      comment: 'Alex was super punctual and the car was immaculate. Great experience!',
      isSafetyIssue: false,
      isSkipped: false,
    });

    const rating2 = this.ratingRepo.create({
      rideId: ride1.id,
      ride: ride1,
      reviewerId: alex.id,
      revieweeId: priya.id,
      rating: 5,
      tags: ['Respectful', 'On Time'],
      comment: 'Pleasant and polite co-rider!',
      isSafetyIssue: false,
      isSkipped: false,
    });
    await this.ratingRepo.save([rating1, rating2]);

    // ─── 8. SEED NOTIFICATIONS ───
    const notif1 = this.notifRepo.create({
      userId: alex.id,
      title: 'Seat Booked! 🚗',
      message: 'Priya Sharma has booked a seat on your ride from HSR Layout to Electronic City.',
      type: 'info',
      read: false,
    });

    const notif2 = this.notifRepo.create({
      userId: priya.id,
      title: 'Ride Confirmed ✨',
      message: 'Your seat with Alex Rivera is confirmed for tomorrow 08:30 AM.',
      type: 'info',
      read: false,
    });

    const notif3 = this.notifRepo.create({
      userId: david.id,
      title: 'Driver En Route 📍',
      message: 'Sarah Chen is en route to Indiranagar pickup point!',
      type: 'info',
      read: false,
    });
    await this.notifRepo.save([notif1, notif2, notif3]);
  }
}
