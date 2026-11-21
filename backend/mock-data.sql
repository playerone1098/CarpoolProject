-- ========================================================
-- CarpoolProject PostgreSQL Schema & Offline Local Mock Data
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    phone VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) DEFAULT 'User',
    gender VARCHAR(50) DEFAULT 'unspecified',
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    mode VARCHAR(50) DEFAULT 'free',
    role VARCHAR(50) DEFAULT 'seeker',
    "isCarOwner" BOOLEAN DEFAULT FALSE,
    "profilePhoto" TEXT,
    "fcmToken" TEXT,
    "homeAddress" JSONB,
    "workAddress" JSONB,
    "carInfo" JSONB,
    rating FLOAT DEFAULT 5.0,
    "ratingCount" INT DEFAULT 0,
    "recentRatings" JSONB,
    "walletBalance" FLOAT DEFAULT 500,
    "payoutBalance" FLOAT DEFAULT 0,
    "bookmarksList" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BRIEFS TABLE
CREATE TABLE IF NOT EXISTS briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'carpool',
    "carpoolResult" JSONB,
    "generalResult" JSONB,
    "chatLog" TEXT,
    timestamp VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RIDES TABLE
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "driverId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "driverName" VARCHAR(255) DEFAULT 'Community Driver',
    "carModel" VARCHAR(255) DEFAULT 'Standard Sedan',
    title VARCHAR(255) DEFAULT 'Commute Ride',
    "seatsAvailable" INT DEFAULT 3,
    "availableSeats" INT DEFAULT 3,
    "pickupLocation" TEXT DEFAULT 'Pickup Point',
    pickup TEXT DEFAULT 'Pickup Point',
    "dropLocation" TEXT DEFAULT 'Drop Location',
    drop TEXT DEFAULT 'Drop Location',
    destination TEXT DEFAULT 'Destination',
    "rideTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time VARCHAR(100) DEFAULT 'Scheduled',
    "groupId" VARCHAR(255),
    "pickupCoords" JSONB,
    "dropCoords" JSONB,
    "routeGeometry" JSONB,
    price FLOAT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'scheduled',
    "tripState" VARCHAR(50) DEFAULT 'SCHEDULED',
    "driverLocation" JSONB,
    "licensePlate" VARCHAR(100),
    "driverRating" FLOAT DEFAULT 0.0,
    "driverPhone" VARCHAR(50),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. RIDE PASSENGERS (JOIN TABLE)
CREATE TABLE IF NOT EXISTS ride_passengers (
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (ride_id, user_id)
);

-- 6. TRIPS TABLE
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP,
    origin JSONB,
    destination JSONB,
    route_polyline TEXT,
    seats_total INT DEFAULT 1,
    seats_available INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TRIP RIDERS TABLE
CREATE TABLE IF NOT EXISTS trip_riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "rideId" UUID REFERENCES rides(id) ON DELETE CASCADE,
    "riderId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "driverId" UUID REFERENCES users(id) ON DELETE CASCADE,
    amount FLOAT NOT NULL,
    seats INT DEFAULT 1,
    "paymentMethod" VARCHAR(50) DEFAULT 'wallet',
    status VARCHAR(50) DEFAULT 'hold',
    "platformFee" FLOAT DEFAULT 0,
    "driverEarnings" FLOAT DEFAULT 0,
    "transactionId" VARCHAR(255) NOT NULL,
    "cashConfirmedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. LEDGERS TABLE
CREATE TABLE IF NOT EXISTS ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "paymentId" UUID,
    "rideId" UUID,
    type VARCHAR(50) NOT NULL,
    "grossAmount" FLOAT NOT NULL,
    "platformFee" FLOAT DEFAULT 0,
    "netAmount" FLOAT NOT NULL,
    "paymentMethod" VARCHAR(50) DEFAULT 'online',
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. RATINGS TABLE
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "rideId" UUID REFERENCES rides(id) ON DELETE CASCADE,
    "reviewerId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "revieweeId" UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    tags JSONB,
    comment TEXT,
    "isSafetyIssue" BOOLEAN DEFAULT FALSE,
    "isSkipped" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. ADMIN TICKETS TABLE
CREATE TABLE IF NOT EXISTS admin_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "rideId" UUID REFERENCES rides(id) ON DELETE CASCADE,
    "reporterId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "subjectId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "ratingId" UUID,
    "safetyTags" JSONB,
    comment TEXT,
    severity VARCHAR(50) DEFAULT 'HIGH',
    status VARCHAR(50) DEFAULT 'OPEN',
    reason TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. CHATS TABLE
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    "rideId" UUID REFERENCES rides(id) ON DELETE CASCADE,
    "senderId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "senderName" VARCHAR(255) DEFAULT 'User',
    "receiverId" UUID REFERENCES users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    _id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    "createdById" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. GROUP MEMBERS (JOIN TABLE)
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

-- ========================================================
-- SEED DATA (Password for all accounts is: password123)
-- bcrypt hash: $2b$10$O9wRkn2j7T7a.wG1aJd3..VfFmQkPz5k0gO/tD5aGkU2pC.5nFzGy
-- ========================================================

-- Users
INSERT INTO users (id, _id, phone, name, gender, email, password, mode, role, "isCarOwner", "profilePhoto", "carInfo", "homeAddress", "workAddress", rating, "ratingCount", "walletBalance", "payoutBalance")
VALUES 
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '9876543210', 'Alex Rivera', 'male', 'alex.rivera@example.com', '$2b$10$O9wRkn2j7T7a.wG1aJd3..VfFmQkPz5k0gO/tD5aGkU2pC.5nFzGy', 'pro', 'driver', TRUE, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '{"model": "Toyota Camry Hybrid (Silver)", "color": "Silver", "plateNumber": "KA-01-EQ-4421"}', '{"address": "HSR Layout Sector 2, Bangalore", "coords": {"lat": 12.9121, "lng": 77.6446}}', '{"address": "Electronic City Phase 1, Bangalore", "coords": {"lat": 12.8452, "lng": 77.6602}}', 4.95, 42, 1500, 4250),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '9876543211', 'Sarah Chen', 'female', 'sarah.chen@example.com', '$2b$10$O9wRkn2j7T7a.wG1aJd3..VfFmQkPz5k0gO/tD5aGkU2pC.5nFzGy', 'pro', 'driver', TRUE, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', '{"model": "Honda Civic (Midnight Blue)", "color": "Blue", "plateNumber": "KA-03-MG-8890"}', '{"address": "Indiranagar 100ft Road, Bangalore", "coords": {"lat": 12.9719, "lng": 77.6412}}', '{"address": "Manyata Tech Park, Bangalore", "coords": {"lat": 13.0475, "lng": 77.6200}}', 4.88, 31, 900, 3100),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '9876543212', 'Priya Sharma', 'female', 'priya.sharma@example.com', '$2b$10$O9wRkn2j7T7a.wG1aJd3..VfFmQkPz5k0gO/tD5aGkU2pC.5nFzGy', 'free', 'seeker', FALSE, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', NULL, '{"address": "Koramangala 4th Block, Bangalore", "coords": {"lat": 12.9340, "lng": 77.6227}}', '{"address": "Bagmane Tech Park, CV Raman Nagar", "coords": {"lat": 12.9818, "lng": 77.6631}}', 5.0, 18, 850, 0),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '9876543213', 'David Miller', 'male', 'david.miller@example.com', '$2b$10$O9wRkn2j7T7a.wG1aJd3..VfFmQkPz5k0gO/tD5aGkU2pC.5nFzGy', 'free', 'seeker', FALSE, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NULL, '{"address": "MG Road Metro Station, Bangalore", "coords": {"lat": 12.9756, "lng": 77.6066}}', '{"address": "Kempegowda International Airport", "coords": {"lat": 13.1986, "lng": 77.7066}}', 4.90, 12, 400, 0)
ON CONFLICT (phone) DO NOTHING;

-- Bookmarks
INSERT INTO bookmarks (id, _id, user_id, label, address, latitude, longitude)
VALUES
('b1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Home', 'Koramangala 4th Block, Bangalore', 12.9340, 77.6227),
('b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Office', 'Bagmane Tech Park, CV Raman Nagar', 12.9818, 77.6631)
ON CONFLICT (id) DO NOTHING;

-- Rides
INSERT INTO rides (id, _id, "driverId", "driverName", "carModel", title, "seatsAvailable", "availableSeats", "pickupLocation", pickup, "dropLocation", drop, destination, "rideTime", time, price, "pickupCoords", "dropCoords", "routeGeometry", status, "tripState", "licensePlate", "driverRating", "driverPhone")
VALUES
('r1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Alex Rivera', 'Toyota Camry Hybrid (Silver)', 'Morning Tech Corridor Commute', 2, 2, 'HSR Layout BDA Complex', 'HSR Layout BDA Complex', 'Electronic City Phase 1 Main Gate', 'Electronic City Phase 1 Main Gate', 'Electronic City Phase 1 Main Gate', NOW() + INTERVAL '1 day', '08:30 AM', 150, '{"lat": 12.9121, "lng": 77.6446}', '{"lat": 12.8452, "lng": 77.6602}', '[[12.9121, 77.6446], [12.89, 77.65], [12.865, 77.655], [12.8452, 77.6602]]', 'scheduled', 'SCHEDULED', 'KA-01-EQ-4421', 4.95, '9876543210'),
('r2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Sarah Chen', 'Honda Civic (Midnight Blue)', 'Airport Live Express Carpool', 1, 1, 'Indiranagar 100ft Road', 'Indiranagar 100ft Road', 'Kempegowda International Airport (BLR)', 'Kempegowda International Airport (BLR)', 'Kempegowda International Airport (BLR)', NOW() + INTERVAL '2 hours', 'Live Now', 320, '{"lat": 12.9719, "lng": 77.6412}', '{"lat": 13.1986, "lng": 77.7066}', '[[12.9719, 77.6412], [13.01, 77.66], [13.1, 77.685], [13.1986, 77.7066]]', 'ongoing', 'DRIVER_EN_ROUTE', 'KA-03-MG-8890', 4.88, '9876543211')
ON CONFLICT (id) DO NOTHING;

-- Ride Passengers
INSERT INTO ride_passengers (ride_id, user_id)
VALUES
('r1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
('r2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- Groups
INSERT INTO groups (id, _id, name, description, icon, "createdById")
VALUES
('g1111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'Tech Park Daily Commuters', 'Daily carpool group for folks traveling between Koramangala/HSR and Electronic City.', '🚗', '11111111-1111-1111-1111-111111111111'),
('g2222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222', 'BLR Airport Travelers Club', 'Cost-effective ride shares to Kempegowda International Airport.', '✈️', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Group Members
INSERT INTO group_members (group_id, user_id)
VALUES
('g1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
('g1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
('g1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (id, _id, "userId", title, message, type, read)
VALUES
('n1111111-1111-1111-1111-111111111111', 'n1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Seat Booked! 🚗', 'Priya Sharma has booked a seat on your ride from HSR Layout to Electronic City.', 'info', FALSE),
('n2222222-2222-2222-2222-222222222222', 'n2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Ride Confirmed ✨', 'Your seat with Alex Rivera is confirmed for tomorrow 08:30 AM.', 'info', FALSE)
ON CONFLICT (id) DO NOTHING;
