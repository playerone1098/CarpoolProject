import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Ledger } from './entities/ledger.entity';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { CreatePaymentHoldDto } from './dto/create-payment-hold.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Ledger) private readonly ledgerRepo: Repository<Ledger>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private normalizePayment(payment: Payment): Payment {
    if (!payment) return payment;
    payment._id = payment.id;
    if (payment.rider) payment.rider._id = payment.rider.id;
    if (payment.driver) payment.driver._id = payment.driver.id;
    if (payment.ride) payment.ride._id = payment.ride.id;
    return payment;
  }

  async createHold(riderId: string, dto: CreatePaymentHoldDto) {
    const ride = await this.rideRepo.findOne({
      where: [{ id: dto.rideId }, { _id: dto.rideId }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const driverId = ride.driverId || ride.driver?.id;
    if (driverId === riderId) {
      throw new BadRequestException('You cannot book your own ride');
    }

    const isAlreadyPassenger = (ride.passengers || []).some(
      (p) => p.id === riderId || p._id === riderId,
    );
    if (isAlreadyPassenger) {
      throw new BadRequestException('You have already booked a seat on this ride');
    }

    const availableSeats =
      ride.availableSeats !== undefined ? ride.availableSeats : ride.seatsAvailable;
    const requestedSeats = dto.seats || 1;
    if (availableSeats < requestedSeats) {
      throw new BadRequestException('Not enough seats available on this ride');
    }

    const unitPrice = ride.price ?? 0;
    const totalFare = unitPrice * requestedSeats;
    const platformFee = Math.round(totalFare * 0.10 * 100) / 100;
    const driverEarnings = Math.round((totalFare - platformFee) * 100) / 100;

    const rider = await this.userRepo.findOne({
      where: [{ id: riderId }, { _id: riderId }],
    });
    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    if (dto.paymentMethod === 'wallet') {
      const currentWallet = rider.walletBalance ?? 0;
      if (currentWallet < totalFare) {
        throw new BadRequestException(
          `Insufficient wallet balance (₹${currentWallet.toFixed(2)}). Required: ₹${totalFare.toFixed(2)}. Please top up your wallet or select another payment method.`,
        );
      }
      rider.walletBalance = currentWallet - totalFare;
      await this.userRepo.save(rider);
    }

    const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = dto.paymentMethod === 'cash' ? 'pending_cash' : 'hold';

    const payment = this.paymentRepo.create({
      rideId: ride.id,
      ride,
      riderId: rider.id,
      rider,
      driverId: driverId || riderId,
      driver: ride.driver,
      amount: totalFare,
      seats: requestedSeats,
      paymentMethod: dto.paymentMethod,
      status,
      platformFee,
      driverEarnings,
      transactionId: txnId,
    });
    const savedPayment = await this.paymentRepo.save(payment);

    ride.passengers = ride.passengers || [];
    ride.passengers.push(rider);
    if (ride.seatsAvailable >= requestedSeats) ride.seatsAvailable -= requestedSeats;
    if (ride.availableSeats !== undefined && ride.availableSeats >= requestedSeats) {
      ride.availableSeats -= requestedSeats;
    }
    await this.rideRepo.save(ride);

    if (driverId) {
      try {
        const notification = await this.notificationsService.create({
          userId: driverId,
          title: 'New Booking & Payment Hold!',
          message: `${rider.name || 'A rider'} booked ${requestedSeats} seat(s) for ₹${totalFare} (${dto.paymentMethod.toUpperCase()}).`,
          type: 'info',
        });
        this.notificationsGateway.sendToUser(driverId, 'new_notification', notification);
      } catch (e) {
        this.logger.error('Error creating notification for payment hold:', e);
      }
    }

    return {
      message: 'Booking confirmed and payment hold authorized successfully.',
      payment: this.normalizePayment(savedPayment),
      ride,
    };
  }

  async topUpWallet(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }
    const user = await this.userRepo.findOne({
      where: [{ id: userId }, { _id: userId }],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.walletBalance = (user.walletBalance ?? 0) + amount;
    await this.userRepo.save(user);

    const ledger = this.ledgerRepo.create({
      userId: user.id,
      user,
      type: 'credit',
      grossAmount: amount,
      platformFee: 0,
      netAmount: amount,
      paymentMethod: 'online',
      description: `In-App Wallet Top-Up (+₹${amount})`,
    });
    const savedLedger = await this.ledgerRepo.save(ledger);
    savedLedger._id = savedLedger.id;

    return {
      message: `Successfully added ₹${amount} to wallet!`,
      walletBalance: user.walletBalance,
      ledger: savedLedger,
    };
  }

  async completeTripAndSettle(rideId: string, driverId: string, cashConfirmed = false) {
    const ride = await this.rideRepo.findOne({
      where: [{ id: rideId }, { _id: rideId }],
      relations: ['driver', 'passengers'],
    });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const rideDriverId = ride.driverId || ride.driver?.id;
    if (rideDriverId !== driverId) {
      throw new ForbiddenException('Only the driver of this ride can complete the trip');
    }

    const payments = await this.paymentRepo.find({
      where: {
        rideId: ride.id,
        status: In(['hold', 'pending_cash']),
      },
      relations: ['rider', 'driver'],
    });

    const pendingCashPayments = payments.filter((p) => p.paymentMethod === 'cash');
    if (pendingCashPayments.length > 0 && !cashConfirmed) {
      const totalCashToCollect = pendingCashPayments.reduce((sum, p) => sum + p.amount, 0);
      const riderNames = pendingCashPayments
        .map((p) => p.rider?.name || 'Rider')
        .join(', ');

      return {
        requiresCashConfirmation: true,
        message: `Collect ₹${totalCashToCollect} in cash from ${riderNames}`,
        totalCashToCollect,
        pendingCashPayments,
      };
    }

    const driver = await this.userRepo.findOne({
      where: [{ id: driverId }, { _id: driverId }],
    });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const processedPayments: Payment[] = [];
    let totalDriverNetPayout = 0;

    for (const payment of payments) {
      payment.status = 'captured';
      payment.completedAt = new Date();
      if (payment.paymentMethod === 'cash') {
        payment.cashConfirmedAt = new Date();
      }
      await this.paymentRepo.save(payment);

      totalDriverNetPayout += payment.driverEarnings;
      driver.payoutBalance = (driver.payoutBalance ?? 0) + payment.driverEarnings;

      const driverLedger = this.ledgerRepo.create({
        userId: driver.id,
        user: driver,
        paymentId: payment.id,
        rideId: ride.id,
        type: 'credit',
        grossAmount: payment.amount,
        platformFee: payment.platformFee,
        netAmount: payment.driverEarnings,
        paymentMethod: payment.paymentMethod,
        description: `Ride Fare Payout (${ride.pickupLocation} ➔ ${ride.dropLocation}) - 10% Platform Fee Deducted`,
      });
      await this.ledgerRepo.save(driverLedger);

      const rId = payment.riderId || payment.rider?.id;
      const riderLedger = this.ledgerRepo.create({
        userId: rId,
        paymentId: payment.id,
        rideId: ride.id,
        type: 'debit',
        grossAmount: payment.amount,
        platformFee: 0,
        netAmount: payment.amount,
        paymentMethod: payment.paymentMethod,
        description: `Fare Settled for Ride to ${ride.dropLocation}`,
      });
      await this.ledgerRepo.save(riderLedger);

      const payload = {
        event: 'payment_success',
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        rideId: ride.id,
        pickup: ride.pickupLocation,
        drop: ride.dropLocation,
        driverEarnings: payment.driverEarnings,
        platformFee: payment.platformFee,
        completedAt: payment.completedAt,
      };

      if (rId) this.notificationsGateway.sendToUser(rId, 'payment_success', payload);
      this.notificationsGateway.sendToUser(driver.id, 'payment_success', payload);

      try {
        if (rId) {
          const notifRider = await this.notificationsService.create({
            userId: rId,
            title: 'Trip Completed & Fare Settled!',
            message: `Your ride from ${ride.pickupLocation} to ${ride.dropLocation} is complete. Paid ₹${payment.amount} via ${payment.paymentMethod.toUpperCase()}.`,
            type: 'info',
          });
          this.notificationsGateway.sendToUser(rId, 'new_notification', notifRider);
        }

        const notifDriver = await this.notificationsService.create({
          userId: driver.id,
          title: 'Earnings Credited!',
          message: `₹${payment.driverEarnings} credited to your payout balance (₹${payment.platformFee} platform fee).`,
          type: 'info',
        });
        this.notificationsGateway.sendToUser(driver.id, 'new_notification', notifDriver);
      } catch (e) {
        this.logger.error('Error creating completion notifications:', e);
      }

      processedPayments.push(payment);
    }

    await this.userRepo.save(driver);

    ride.status = 'completed';
    ride.tripState = 'TRIP_COMPLETED';
    await this.rideRepo.save(ride);

    return {
      requiresCashConfirmation: false,
      status: 'completed',
      message: 'Trip completed successfully and fare settled.',
      ride,
      processedPaymentsCount: processedPayments.length,
      totalDriverNetPayout,
    };
  }

  async getDriverLedger(driverId: string) {
    const driver = await this.userRepo.findOne({
      where: [{ id: driverId }, { _id: driverId }],
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const transactions = await this.ledgerRepo.find({
      where: { userId: driver.id },
      order: { createdAt: 'DESC' },
    });

    const totalEarned = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.netAmount, 0);

    const totalPlatformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0);

    return {
      payoutBalance: driver.payoutBalance ?? 0,
      totalEarned,
      totalPlatformFees,
      completedTripsCount: transactions.length,
      transactions: transactions.map((t) => {
        t._id = t.id;
        return t;
      }),
    };
  }

  async getWalletInfo(userId: string) {
    const user = await this.userRepo.findOne({
      where: [{ id: userId }, { _id: userId }],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transactions = await this.ledgerRepo.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    return {
      walletBalance: user.walletBalance ?? 0,
      transactions: transactions.map((t) => {
        t._id = t.id;
        return t;
      }),
    };
  }

  async getReceipt(paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: [{ id: paymentId }, { _id: paymentId }],
      relations: ['ride', 'rider', 'driver'],
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const ride = payment.ride;
    const rider = payment.rider;
    const driver = payment.driver;

    return {
      invoiceNumber: `INV-${payment.transactionId}`,
      transactionId: payment.transactionId,
      date: payment.completedAt || payment.createdAt,
      rideDetails: {
        title: ride?.title || 'Commute Ride',
        pickup: ride?.pickupLocation || 'Pickup Point',
        drop: ride?.dropLocation || 'Drop Location',
        date: ride?.rideTime || payment.createdAt,
        seats: payment.seats,
      },
      parties: {
        riderName: rider?.name || 'Rider',
        riderPhone: rider?.phone || 'N/A',
        driverName: driver?.name || 'Driver',
        driverPhone: driver?.phone || 'N/A',
      },
      fareBreakdown: {
        totalFare: payment.amount,
        platformFee: payment.platformFee,
        netDriverEarnings: payment.driverEarnings,
        paymentMethod: payment.paymentMethod.toUpperCase(),
        status: payment.status.toUpperCase(),
      },
    };
  }
}
