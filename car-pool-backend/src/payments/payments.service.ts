import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Ledger, LedgerDocument } from './schemas/ledger.schema';
import { Ride } from '../rides/ride.schema';
import { User } from '../users/user.schema';
import { CreatePaymentHoldDto } from './dto/create-payment-hold.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Ledger.name) private ledgerModel: Model<LedgerDocument>,
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ─── 1. Fare Calculation & Option Selection / Pre-Ride Hold ───
  async createHold(riderId: string, dto: CreatePaymentHoldDto) {
    const ride = await this.rideModel.findById(dto.rideId).populate('driver').exec();
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const driverIdStr = ride.driver ? (ride.driver as any)._id?.toString() || ride.driver.toString() : '';
    if (driverIdStr === riderId) {
      throw new BadRequestException('You cannot book your own ride');
    }

    const isAlreadyPassenger = (ride.passengers || []).some(
      (p) => p.toString() === riderId,
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

    // Fare calculation: price per seat * requested seats
    const unitPrice = ride.price ?? 0;
    const totalFare = unitPrice * requestedSeats;
    const platformFee = Math.round(totalFare * 0.10 * 100) / 100; // 10% platform fee
    const driverEarnings = Math.round((totalFare - platformFee) * 100) / 100;

    const rider = await this.userModel.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    // Validation for Wallet
    if (dto.paymentMethod === 'wallet') {
      const currentWallet = rider.walletBalance ?? 0;
      if (currentWallet < totalFare) {
        throw new BadRequestException(
          `Insufficient wallet balance (₹${currentWallet.toFixed(2)}). Required: ₹${totalFare.toFixed(2)}. Please top up your wallet or select another payment method.`,
        );
      }
      // Hold/Deduct amount from Rider's wallet balance
      rider.walletBalance = currentWallet - totalFare;
      await rider.save();
    }

    const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = dto.paymentMethod === 'cash' ? 'pending_cash' : 'hold';

    const payment = new this.paymentModel({
      rideId: new Types.ObjectId(dto.rideId),
      rider: new Types.ObjectId(riderId),
      driver: ride.driver,
      amount: totalFare,
      seats: requestedSeats,
      paymentMethod: dto.paymentMethod,
      status,
      platformFee,
      driverEarnings,
      transactionId: txnId,
    });
    await payment.save();

    // Lock booking on ride
    ride.passengers.push(new Types.ObjectId(riderId));
    if (ride.seatsAvailable >= requestedSeats) ride.seatsAvailable -= requestedSeats;
    if (ride.availableSeats !== undefined && ride.availableSeats >= requestedSeats) {
      ride.availableSeats -= requestedSeats;
    }
    await ride.save();

    // Create Notification to Driver
    try {
      const notification = await this.notificationsService.create({
        userId: driverIdStr,
        title: 'New Booking & Payment Hold!',
        message: `${rider.name || 'A rider'} booked ${requestedSeats} seat(s) for ₹${totalFare} (${dto.paymentMethod.toUpperCase()}).`,
        type: 'info',
      });
      this.notificationsGateway.sendToUser(driverIdStr, 'new_notification', notification);
    } catch (e) {
      this.logger.error('Error creating notification for payment hold:', e);
    }

    return {
      message: 'Booking confirmed and payment hold authorized successfully.',
      payment,
      ride,
    };
  }

  // ─── 2. Top-Up Wallet ───
  async topUpWallet(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.walletBalance = (user.walletBalance ?? 0) + amount;
    await user.save();

    // Log wallet top-up in ledger
    const ledger = new this.ledgerModel({
      user: new Types.ObjectId(userId),
      type: 'credit',
      grossAmount: amount,
      platformFee: 0,
      netAmount: amount,
      paymentMethod: 'online',
      description: `In-App Wallet Top-Up (+₹${amount})`,
    });
    await ledger.save();

    return {
      message: `Successfully added ₹${amount} to wallet!`,
      walletBalance: user.walletBalance,
      ledger,
    };
  }

  // ─── 3. Trip Completion & Payment Capture & Settlement ───
  async completeTripAndSettle(rideId: string, driverId: string, cashConfirmed = false) {
    const ride = await this.rideModel.findById(rideId).populate('driver passengers').exec();
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const rideDriverId = ride.driver ? (ride.driver as any)._id?.toString() || ride.driver.toString() : '';
    if (rideDriverId !== driverId) {
      throw new ForbiddenException('Only the driver of this ride can complete the trip');
    }

    // Find pending/held payments for this ride
    const payments = await this.paymentModel.find({
      rideId: new Types.ObjectId(rideId),
      status: { $in: ['hold', 'pending_cash'] },
    }).populate('rider').exec();

    // Cash Option Handling: check if any pending cash payment needs confirmation
    const pendingCashPayments = payments.filter((p) => p.paymentMethod === 'cash');
    if (pendingCashPayments.length > 0 && !cashConfirmed) {
      // Driver must confirm cash receipt
      const totalCashToCollect = pendingCashPayments.reduce((sum, p) => sum + p.amount, 0);
      const riderNames = pendingCashPayments
        .map((p) => (p.rider as any)?.name || 'Rider')
        .join(', ');

      return {
        requiresCashConfirmation: true,
        message: `Collect ₹${totalCashToCollect} in cash from ${riderNames}`,
        totalCashToCollect,
        pendingCashPayments,
      };
    }

    const driver = await this.userModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const processedPayments = [];
    let totalDriverNetPayout = 0;

    for (const payment of payments) {
      payment.status = 'captured';
      payment.completedAt = new Date();
      if (payment.paymentMethod === 'cash') {
        payment.cashConfirmedAt = new Date();
      }
      await payment.save();

      totalDriverNetPayout += payment.driverEarnings;

      // Update Driver's Payout Balance
      driver.payoutBalance = (driver.payoutBalance ?? 0) + payment.driverEarnings;

      // 1. Driver Ledger Entry (Earnings breakdown)
      const driverLedger = new this.ledgerModel({
        user: new Types.ObjectId(driverId),
        paymentId: payment._id,
        rideId: ride._id,
        type: 'credit',
        grossAmount: payment.amount,
        platformFee: payment.platformFee,
        netAmount: payment.driverEarnings,
        paymentMethod: payment.paymentMethod,
        description: `Ride Fare Payout (${ride.pickupLocation} ➔ ${ride.dropLocation}) - 10% Platform Fee Deducted`,
      });
      await driverLedger.save();

      // 2. Rider Ledger Entry
      const riderId = (payment.rider as any)._id?.toString() || payment.rider.toString();
      const riderLedger = new this.ledgerModel({
        user: payment.rider,
        paymentId: payment._id,
        rideId: ride._id,
        type: 'debit',
        grossAmount: payment.amount,
        platformFee: 0,
        netAmount: payment.amount,
        paymentMethod: payment.paymentMethod,
        description: `Fare Settled for Ride to ${ride.dropLocation}`,
      });
      await riderLedger.save();

      // Broadcast WebSocket payment_success event
      const payload = {
        event: 'payment_success',
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        rideId: ride._id,
        pickup: ride.pickupLocation,
        drop: ride.dropLocation,
        driverEarnings: payment.driverEarnings,
        platformFee: payment.platformFee,
        completedAt: payment.completedAt,
      };

      this.notificationsGateway.sendToUser(riderId, 'payment_success', payload);
      this.notificationsGateway.sendToUser(driverId, 'payment_success', payload);

      // Push notification
      try {
        const notifRider = await this.notificationsService.create({
          userId: riderId,
          title: 'Trip Completed & Fare Settled!',
          message: `Your ride from ${ride.pickupLocation} to ${ride.dropLocation} is complete. Paid ₹${payment.amount} via ${payment.paymentMethod.toUpperCase()}.`,
          type: 'info',
        });
        this.notificationsGateway.sendToUser(riderId, 'new_notification', notifRider);

        const notifDriver = await this.notificationsService.create({
          userId: driverId,
          title: 'Earnings Credited!',
          message: `₹${payment.driverEarnings} credited to your payout balance (₹${payment.platformFee} platform fee).`,
          type: 'info',
        });
        this.notificationsGateway.sendToUser(driverId, 'new_notification', notifDriver);
      } catch (e) {
        this.logger.error('Error creating completion notifications:', e);
      }

      processedPayments.push(payment);
    }

    await driver.save();

    // Mark ride as completed
    ride.status = 'completed';
    await ride.save();

    return {
      requiresCashConfirmation: false,
      status: 'completed',
      message: 'Trip completed successfully and fare settled.',
      ride,
      processedPaymentsCount: processedPayments.length,
      totalDriverNetPayout,
    };
  }

  // ─── 4. Fetch Driver Payout Ledger ───
  async getDriverLedger(driverId: string) {
    const driver = await this.userModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const transactions = await this.ledgerModel
      .find({ user: new Types.ObjectId(driverId) })
      .sort({ createdAt: -1 })
      .exec();

    const totalEarned = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.netAmount, 0);

    const totalPlatformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0);

    return {
      payoutBalance: driver.payoutBalance ?? 0,
      totalEarned,
      totalPlatformFees,
      completedTripsCount: transactions.length,
      transactions,
    };
  }

  // ─── 5. Fetch Rider Wallet & History ───
  async getWalletInfo(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transactions = await this.ledgerModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    return {
      walletBalance: user.walletBalance ?? 0,
      transactions,
    };
  }

  // ─── 6. Generate Digital Invoice / Receipt Data ───
  async getReceipt(paymentId: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('rideId rider driver')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const ride = payment.rideId as any;
    const rider = payment.rider as any;
    const driver = payment.driver as any;

    return {
      invoiceNumber: `INV-${payment.transactionId}`,
      transactionId: payment.transactionId,
      date: payment.completedAt || (payment as any).createdAt,
      rideDetails: {
        title: ride?.title || 'Commute Ride',
        pickup: ride?.pickupLocation || 'Pickup Point',
        drop: ride?.dropLocation || 'Drop Location',
        date: ride?.rideTime || (payment as any).createdAt,
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
