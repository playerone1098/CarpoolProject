import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './src/users/user.schema';
import { Group } from './src/groups/group.schema';
import { Ride } from './src/rides/ride.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const groupModel = app.get<Model<Group>>(getModelToken(Group.name));
  const rideModel = app.get<Model<Ride>>(getModelToken(Ride.name));

  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await userModel.deleteMany({});
  await groupModel.deleteMany({});
  await rideModel.deleteMany({});

  console.log('🧹 Cleared existing data');

  // Create dummy users
  const users = [
    { phone: '+918875760063', name: 'John Doe', mode: 'free' },
    { phone: '+919876543210', name: 'Jane Smith', mode: 'pro' },
    { phone: '+918765432109', name: 'Mike Johnson', mode: 'free' },
    { phone: '+919876512345', name: 'Sarah Wilson', mode: 'pro' },
    { phone: '+918765412398', name: 'David Brown', mode: 'free' },
    { phone: '+919876598765', name: 'Emma Davis', mode: 'free' },
    { phone: '+918765487654', name: 'Chris Miller', mode: 'pro' },
    { phone: '+919876576543', name: 'Lisa Garcia', mode: 'free' },
  ];

  const createdUsers = await userModel.insertMany(users);
  console.log(`👥 Created ${createdUsers.length} users`);

  // Create dummy groups
  const groups = [
    {
      name: 'Tech Park Commuters',
      type: 'public',
      createdBy: createdUsers[0]._id,
      members: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[2]._id]
    },
    {
      name: 'University Students',
      type: 'public',
      createdBy: createdUsers[1]._id,
      members: [createdUsers[1]._id, createdUsers[3]._id, createdUsers[4]._id]
    },
    {
      name: 'Private Office Group',
      type: 'private',
      createdBy: createdUsers[2]._id,
      members: [createdUsers[2]._id, createdUsers[5]._id]
    },
    {
      name: 'Weekend Travelers',
      type: 'public',
      createdBy: createdUsers[3]._id,
      members: [createdUsers[3]._id, createdUsers[6]._id, createdUsers[7]._id]
    },
  ];

  const createdGroups = await groupModel.insertMany(groups);
  console.log(`🏢 Created ${createdGroups.length} groups`);

  // Create dummy rides
  const rides = [
    {
      groupId: createdGroups[0]._id,
      driver: createdUsers[0]._id,
      carModel: 'Toyota Camry',
      seatsAvailable: 3,
      pickupLocation: 'Tech Park Main Gate',
      dropLocation: 'Downtown Mall',
      rideTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      passengers: [createdUsers[1]._id, createdUsers[2]._id]
    },
    {
      groupId: createdGroups[0]._id,
      driver: createdUsers[1]._id,
      carModel: 'Honda Civic',
      seatsAvailable: 2,
      pickupLocation: 'University Campus',
      dropLocation: 'Airport Terminal 1',
      rideTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      passengers: [createdUsers[3]._id]
    },
    {
      groupId: createdGroups[1]._id,
      driver: createdUsers[2]._id,
      carModel: 'Ford Focus',
      seatsAvailable: 4,
      pickupLocation: 'Shopping Center',
      dropLocation: 'Movie Theater',
      rideTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      passengers: [createdUsers[4]._id, createdUsers[5]._id]
    },
    {
      groupId: createdGroups[2]._id,
      driver: createdUsers[3]._id,
      carModel: 'Tesla Model 3',
      seatsAvailable: 3,
      pickupLocation: 'Private Office Building',
      dropLocation: 'Restaurant District',
      rideTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
      passengers: [createdUsers[6]._id]
    },
    {
      groupId: createdGroups[3]._id,
      driver: createdUsers[4]._id,
      carModel: 'BMW X5',
      seatsAvailable: 5,
      pickupLocation: 'Hotel Lobby',
      dropLocation: 'Train Station',
      rideTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      passengers: [createdUsers[7]._id, createdUsers[0]._id]
    },
  ];

  const createdRides = await rideModel.insertMany(rides);
  console.log(`🚗 Created ${createdRides.length} rides`);

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Summary:
  - Users: ${createdUsers.length}
  - Groups: ${createdGroups.length}
  - Rides: ${createdRides.length}`);

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Error during database seeding:', error);
  process.exit(1);
});
