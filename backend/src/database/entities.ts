import { User } from '../users/entities/user.entity';
import { Bookmark } from '../users/entities/bookmark.entity';
import { Brief } from '../users/entities/brief.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TripRider } from '../trips/entities/trip-rider.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { PushSubscription } from '../notifications/entities/push-subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Ledger } from '../payments/entities/ledger.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { AdminTicket } from '../ratings/entities/admin-ticket.entity';
import { ChatMessage } from '../chat/entities/chat.entity';
import { Group } from '../groups/entities/group.entity';

export const ALL_ENTITIES = [
  User,
  Bookmark,
  Brief,
  Ride,
  Trip,
  TripRider,
  Notification,
  PushSubscription,
  Payment,
  Ledger,
  Rating,
  AdminTicket,
  ChatMessage,
  Group,
];

export {
  User,
  Bookmark,
  Brief,
  Ride,
  Trip,
  TripRider,
  Notification,
  PushSubscription,
  Payment,
  Ledger,
  Rating,
  AdminTicket,
  ChatMessage,
  Group,
};
