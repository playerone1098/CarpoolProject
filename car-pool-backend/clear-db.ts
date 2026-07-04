import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './src/users/user.schema';
import { Bookmark } from './src/users/bookmark.schema';
import { Group } from './src/groups/group.schema';
import { Ride } from './src/rides/ride.schema';
import { Trip } from './src/trips/trip.schema';
import { TripRider } from './src/trips/trip-rider.schema';
import { Notification } from './src/notifications/notification.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const bookmarkModel = app.get<Model<Bookmark>>(getModelToken(Bookmark.name));
  const groupModel = app.get<Model<Group>>(getModelToken(Group.name));
  const rideModel = app.get<Model<Ride>>(getModelToken(Ride.name));
  const tripModel = app.get<Model<Trip>>(getModelToken(Trip.name));
  const tripRiderModel = app.get<Model<TripRider>>(getModelToken(TripRider.name));
  const notificationModel = app.get<Model<Notification>>(getModelToken(Notification.name));

  console.log('🧹 Purging all data from the database...');

  const resultUsers = await userModel.deleteMany({});
  const resultBookmarks = await bookmarkModel.deleteMany({});
  const resultGroups = await groupModel.deleteMany({});
  const resultRides = await rideModel.deleteMany({});
  const resultTrips = await tripModel.deleteMany({});
  const resultTripRiders = await tripRiderModel.deleteMany({});
  const resultNotifications = await notificationModel.deleteMany({});

  console.log('✅ Database clear completed!');
  console.log(`📊 Summary of deleted documents:
  - Users: ${resultUsers.deletedCount}
  - Bookmarks: ${resultBookmarks.deletedCount}
  - Groups: ${resultGroups.deletedCount}
  - Rides: ${resultRides.deletedCount}
  - Trips: ${resultTrips.deletedCount}
  - TripRiders: ${resultTripRiders.deletedCount}
  - Notifications: ${resultNotifications.deletedCount}`);

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Error during database clearing:', error);
  process.exit(1);
});
