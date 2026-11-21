import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { AdminTicket } from './entities/admin-ticket.entity';
import { User } from '../users/entities/user.entity';
import { Ride } from '../rides/entities/ride.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const SAFETY_TAGS = ['Unsafe Driving', 'Harassment', 'Rash Driving', 'Rude Behavior', 'Vehicle Defect', 'Substance Use'];

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectRepository(Rating) private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(AdminTicket) private readonly adminTicketRepo: Repository<AdminTicket>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private async updateAggregateUserRating(userId: string): Promise<number> {
    try {
      const recentRatingsDocs = await this.ratingRepo.find({
        where: { revieweeId: userId, isSkipped: false },
        order: { createdAt: 'DESC' },
        take: 50,
      });

      const user = await this.userRepo.findOne({
        where: [{ id: userId }, { _id: userId }],
      });
      if (!user) return 5.0;

      if (!recentRatingsDocs || recentRatingsDocs.length === 0) {
        user.rating = 5.0;
        user.ratingCount = 0;
        user.recentRatings = [];
        await this.userRepo.save(user);
        return 5.0;
      }

      const ratingValues = recentRatingsDocs.map((r) => r.rating);
      const sum = ratingValues.reduce((acc, curr) => acc + curr, 0);
      const rollingAverage = Number((sum / ratingValues.length).toFixed(2));

      user.rating = rollingAverage;
      user.ratingCount = recentRatingsDocs.length;
      user.recentRatings = ratingValues;
      await this.userRepo.save(user);

      this.logger.log(`Updated aggregate rating for user ${userId}: ${rollingAverage} (${recentRatingsDocs.length} trips)`);
      return rollingAverage;
    } catch (err) {
      this.logger.error(`Error updating aggregate rating for user ${userId}:`, err);
      return 5.0;
    }
  }

  async createRating(dto: CreateRatingDto, reviewerId: string): Promise<any> {
    if (reviewerId === dto.revieweeId) {
      throw new BadRequestException('You cannot rate yourself');
    }

    const ride = await this.rideRepo.findOne({
      where: [{ id: dto.rideId }, { _id: dto.rideId }],
    });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const existingRating = await this.ratingRepo.findOne({
      where: {
        rideId: ride.id,
        reviewerId,
        revieweeId: dto.revieweeId,
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already submitted a rating for this trip participant');
    }

    const tags = dto.tags || [];
    const isSafetyIssue =
      dto.rating <= 2 && tags.some((tag) => SAFETY_TAGS.includes(tag));

    const rating = this.ratingRepo.create({
      rideId: ride.id,
      ride,
      reviewerId,
      revieweeId: dto.revieweeId,
      rating: dto.rating,
      tags,
      comment: dto.comment || '',
      isSafetyIssue,
      isSkipped: dto.isSkipped || false,
    });

    const savedRating = await this.ratingRepo.save(rating);

    let ticketCreated = false;
    if (isSafetyIssue || (dto.rating <= 2 && tags.length > 0)) {
      try {
        const ticket = this.adminTicketRepo.create({
          rideId: ride.id,
          ride,
          reporterId: reviewerId,
          subjectId: dto.revieweeId,
          ratingId: savedRating.id,
          safetyTags: tags,
          comment: dto.comment || 'Low rating with critical safety tag',
          severity: dto.rating === 1 ? 'CRITICAL' : 'HIGH',
          status: 'OPEN',
          reason: `Automated alert: User received ${dto.rating} star rating with tags: ${tags.join(', ')}`,
        });
        await this.adminTicketRepo.save(ticket);
        ticketCreated = true;
        this.logger.warn(`🚨 Admin Safety Ticket Created for ride ${dto.rideId} (Subject: ${dto.revieweeId})`);
      } catch (tErr) {
        this.logger.error('Failed to create safety escalation ticket:', tErr);
      }
    }

    if (!dto.isSkipped) {
      this.updateAggregateUserRating(dto.revieweeId).catch((e) =>
        this.logger.error('Async aggregate calculation error:', e),
      );
    }

    const counterpartyRating = await this.ratingRepo.findOne({
      where: {
        rideId: ride.id,
        reviewerId: dto.revieweeId,
        revieweeId: reviewerId,
      },
    });

    const doubleBlindMet = Boolean(counterpartyRating);

    if (doubleBlindMet) {
      try {
        const notification = await this.notificationsService.create({
          userId: dto.revieweeId,
          title: 'Ride Feedback Unlocked 🌟',
          message: 'Both parties have submitted ratings! You can now view your post-ride trip review.',
          type: 'info',
        });
        this.notificationsGateway.sendToUser(dto.revieweeId, 'new_notification', notification);
      } catch (nErr) {
        this.logger.error('Failed to send double-blind unlock notification:', nErr);
      }
    }

    return {
      message: 'Rating submitted successfully',
      ratingId: savedRating.id,
      doubleBlindMet,
      safetyTicketTriggered: ticketCreated,
    };
  }

  async getRideRatings(rideId: string, currentUserId: string): Promise<any> {
    const allRatings = await this.ratingRepo.find({
      where: [{ rideId }, { ride: { id: rideId } }],
    });

    const currentUserSubmitted = allRatings.some(
      (r) => r.reviewerId === currentUserId,
    );

    const counterpartyRatings = allRatings.filter(
      (r) => r.reviewerId !== currentUserId,
    );

    const doubleBlindUnlocked = currentUserSubmitted && counterpartyRatings.length > 0;

    return {
      rideId,
      userHasRated: currentUserSubmitted,
      doubleBlindUnlocked,
      statusMessage: doubleBlindUnlocked
        ? 'Both parties have completed post-ride ratings. Aggregate ratings updated.'
        : currentUserSubmitted
        ? 'Rating submitted! Waiting for co-participant to submit their feedback.'
        : 'Rating pending.',
    };
  }

  async getUserRatingSummary(userId: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: [{ id: userId }, { _id: userId }],
    });
    if (!user) throw new NotFoundException('User not found');

    const ratings = await this.ratingRepo.find({
      where: { revieweeId: user.id, isSkipped: false },
    });

    const tagCounts: { [tag: string]: number } = {};
    ratings.forEach((r) => {
      (r.tags || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      userId: user.id,
      rating: user.rating || 5.0,
      ratingCount: user.ratingCount || 0,
      recentRatings: user.recentRatings || [],
      topTags,
    };
  }

  async getAdminTickets(): Promise<any[]> {
    const tickets = await this.adminTicketRepo.find({
      relations: ['ride', 'reporter', 'subject'],
      order: { createdAt: 'DESC' },
    });
    return tickets.map((t) => {
      t._id = t.id;
      return t;
    });
  }
}
