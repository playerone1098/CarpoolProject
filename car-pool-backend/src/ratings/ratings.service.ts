import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rating, RatingDocument } from './rating.schema';
import { AdminTicket, AdminTicketDocument } from './admin-ticket.schema';
import { User } from '../users/user.schema';
import { Ride } from '../rides/ride.schema';
import { CreateRatingDto } from './dto/create-rating.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const SAFETY_TAGS = ['Unsafe Driving', 'Harassment', 'Rash Driving', 'Rude Behavior', 'Vehicle Defect', 'Substance Use'];

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
    @InjectModel(AdminTicket.name) private adminTicketModel: Model<AdminTicketDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Asynchronous Aggregate Calculation for User Overall Rating
   * Calculates rolling average of the last 50 trips and updates the reviewee's user record.
   */
  private async updateAggregateUserRating(userId: string): Promise<number> {
    try {
      const revieweeObjectId = new Types.ObjectId(userId);

      // Fetch last 50 non-skipped ratings for this user
      const recentRatingsDocs = await this.ratingModel
        .find({ revieweeId: revieweeObjectId, isSkipped: false })
        .sort({ createdAt: -1 })
        .limit(50)
        .exec();

      if (!recentRatingsDocs || recentRatingsDocs.length === 0) {
        await this.userModel.findByIdAndUpdate(userId, {
          rating: 5.0,
          ratingCount: 0,
          recentRatings: [],
        });
        return 5.0;
      }

      const ratingValues = recentRatingsDocs.map((r) => r.rating);
      const sum = ratingValues.reduce((acc, curr) => acc + curr, 0);
      const rollingAverage = Number((sum / ratingValues.length).toFixed(2));

      await this.userModel.findByIdAndUpdate(userId, {
        rating: rollingAverage,
        ratingCount: recentRatingsDocs.length,
        recentRatings: ratingValues,
      });

      this.logger.log(`Updated aggregate rating for user ${userId}: ${rollingAverage} (${recentRatingsDocs.length} trips)`);
      return rollingAverage;
    } catch (err) {
      this.logger.error(`Error updating aggregate rating for user ${userId}:`, err);
      return 5.0;
    }
  }

  /**
   * Submit double-blind rating post-ride
   */
  async createRating(dto: CreateRatingDto, reviewerId: string): Promise<any> {
    const rideIdObj = new Types.ObjectId(dto.rideId);
    const reviewerIdObj = new Types.ObjectId(reviewerId);
    const revieweeIdObj = new Types.ObjectId(dto.revieweeId);

    if (reviewerId === dto.revieweeId) {
      throw new BadRequestException('You cannot rate yourself');
    }

    // Verify ride exists
    const ride = await this.rideModel.findById(dto.rideId).exec();
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Check if user already submitted rating for this ride and reviewee
    const existingRating = await this.ratingModel.findOne({
      rideId: rideIdObj,
      reviewerId: reviewerIdObj,
      revieweeId: revieweeIdObj,
    });

    if (existingRating) {
      throw new BadRequestException('You have already submitted a rating for this trip participant');
    }

    const tags = dto.tags || [];
    const isSafetyIssue =
      dto.rating <= 2 && tags.some((tag) => SAFETY_TAGS.includes(tag));

    // Store rating document
    const newRating = new this.ratingModel({
      rideId: rideIdObj,
      reviewerId: reviewerIdObj,
      revieweeId: revieweeIdObj,
      rating: dto.rating,
      tags: tags,
      comment: dto.comment || '',
      isSafetyIssue: isSafetyIssue,
      isSkipped: dto.isSkipped || false,
    });

    const savedRating = await newRating.save();

    // Trigger Automated Safety Escalation / Admin Ticket if rating <= 2 with safety tags
    let ticketCreated = false;
    if (isSafetyIssue || (dto.rating <= 2 && tags.length > 0)) {
      try {
        const ticket = new this.adminTicketModel({
          rideId: rideIdObj,
          reporterId: reviewerIdObj,
          subjectId: revieweeIdObj,
          ratingId: savedRating._id,
          safetyTags: tags,
          comment: dto.comment || 'Low rating with critical safety tag',
          severity: dto.rating === 1 ? 'CRITICAL' : 'HIGH',
          status: 'OPEN',
          reason: `Automated alert: User received ${dto.rating} star rating with tags: ${tags.join(', ')}`,
        });
        await ticket.save();
        ticketCreated = true;
        this.logger.warn(`🚨 Admin Safety Ticket Created for ride ${dto.rideId} (Subject: ${dto.revieweeId})`);
      } catch (tErr) {
        this.logger.error('Failed to create safety escalation ticket:', tErr);
      }
    }

    // Asynchronously update aggregated rating score for the reviewee
    if (!dto.isSkipped) {
      this.updateAggregateUserRating(dto.revieweeId).catch((e) =>
        this.logger.error('Async aggregate calculation error:', e),
      );
    }

    // Check Double-Blind Sync Status: Check if counterparty has also submitted their rating
    const counterpartyRating = await this.ratingModel.findOne({
      rideId: rideIdObj,
      reviewerId: revieweeIdObj,
      revieweeId: reviewerIdObj,
    });

    const doubleBlindMet = Boolean(counterpartyRating);

    // Notify reviewee if double-blind sync is complete
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
      ratingId: savedRating._id,
      doubleBlindMet,
      safetyTicketTriggered: ticketCreated,
    };
  }

  /**
   * Get ratings status for a ride with strict Double-Blind and Privacy Protection.
   * Individual ratings, reviewer identities, and comments remain hidden from co-riders,
   * exposing ONLY whether both parties completed their rating and the user's aggregate average rating.
   */
  async getRideRatings(rideId: string, currentUserId: string): Promise<any> {
    const rideIdObj = new Types.ObjectId(rideId);

    const allRatings = await this.ratingModel.find({ rideId: rideIdObj }).exec();

    // Check if current user has submitted their rating
    const currentUserSubmitted = allRatings.some(
      (r) => r.reviewerId.toString() === currentUserId,
    );

    // Find counterparty ratings for this ride
    const counterpartyRatings = allRatings.filter(
      (r) => r.reviewerId.toString() !== currentUserId,
    );

    // Double-Blind Rule: Double-blind condition is met when both rider & driver have submitted
    const doubleBlindUnlocked = currentUserSubmitted && counterpartyRatings.length > 0;

    return {
      rideId,
      userHasRated: currentUserSubmitted,
      doubleBlindUnlocked,
      // Strictly hide individual rating scores, comments, and reviewer names to prevent retaliation.
      // Only display aggregate status message.
      statusMessage: doubleBlindUnlocked
        ? 'Both parties have completed post-ride ratings. Aggregate ratings updated.'
        : currentUserSubmitted
        ? 'Rating submitted! Waiting for co-participant to submit their feedback.'
        : 'Rating pending.',
    };
  }

  /**
   * Get public profile aggregate summary and compliments for a user
   */
  async getUserRatingSummary(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('name rating ratingCount recentRatings').exec();
    if (!user) throw new NotFoundException('User not found');

    // Aggregate tags distribution (top compliment & issue chips)
    const revieweeObjId = new Types.ObjectId(userId);
    const ratings = await this.ratingModel.find({ revieweeId: revieweeObjId, isSkipped: false }).exec();

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
      userId,
      rating: user.rating || 5.0,
      ratingCount: user.ratingCount || 0,
      recentRatings: user.recentRatings || [],
      topTags,
    };
  }

  /**
   * Admin Safety Escalation Tickets List
   */
  async getAdminTickets(): Promise<any[]> {
    return this.adminTicketModel
      .find()
      .populate('reporterId subjectId rideId ratingId', 'name phone title pickupLocation dropLocation')
      .sort({ createdAt: -1 })
      .exec();
  }
}
