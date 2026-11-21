import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  AfterLoad,
  BeforeInsert,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  _id?: string;

  @Column({ nullable: true })
  driverId?: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column({ default: 'Community Driver' })
  driverName: string;

  @Column({ default: 'Standard Sedan' })
  carModel: string;

  @Column({ default: 'Commute Ride' })
  title: string;

  @Column({ type: 'int', default: 3 })
  seatsAvailable: number;

  @Column({ type: 'int', default: 3 })
  availableSeats: number;

  @Column({ default: 'Pickup Point' })
  pickupLocation: string;

  @Column({ default: 'Pickup Point' })
  pickup: string;

  @Column({ default: 'Drop Location' })
  dropLocation: string;

  @Column({ default: 'Drop Location' })
  drop: string;

  @Column({ default: 'Destination' })
  destination: string;

  @Column({ nullable: true })
  rideTime: Date;

  @Column({ default: 'Scheduled' })
  time: string;

  @Column({ nullable: true })
  groupId?: string;

  @ManyToMany(() => User, { eager: true, cascade: true })
  @JoinTable({
    name: 'ride_passengers',
    joinColumn: { name: 'ride_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  passengers: User[];

  @Column({ type: 'simple-json', nullable: true })
  pickupCoords?: { lat: number; lng: number };

  @Column({ type: 'simple-json', nullable: true })
  dropCoords?: { lat: number; lng: number };

  @Column({ type: 'simple-json', nullable: true })
  routeGeometry?: number[][];

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ default: 'scheduled' })
  status: string;

  @Column({ default: 'SCHEDULED' })
  tripState: string;

  @Column({ type: 'simple-json', nullable: true })
  driverLocation?: {
    lat: number;
    lng: number;
    bearing?: number;
    speed?: number;
    updatedAt?: Date;
  };

  @Column({ nullable: true })
  licensePlate?: string;

  @Column({ type: 'float', default: 0.0 })
  driverRating: number;

  @Column({ nullable: true })
  driverPhone?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  @BeforeInsert()
  syncId() {
    if (!this._id && this.id) {
      this._id = this.id;
    }
  }
}
