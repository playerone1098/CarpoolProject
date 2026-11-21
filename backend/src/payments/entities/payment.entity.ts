import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  AfterLoad,
  BeforeInsert,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ride } from '../../rides/entities/ride.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  _id?: string;

  @Column()
  rideId: string;

  @ManyToOne(() => Ride, { eager: true, nullable: true })
  @JoinColumn({ name: 'rideId' })
  ride?: Ride;

  @Column()
  riderId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'riderId' })
  rider: User;

  @Column()
  driverId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'int', default: 1 })
  seats: number;

  @Column({ default: 'wallet' })
  paymentMethod: string;

  @Column({ default: 'hold' })
  status: string;

  @Column({ type: 'float', default: 0 })
  platformFee: number;

  @Column({ type: 'float', default: 0 })
  driverEarnings: number;

  @Column()
  transactionId: string;

  @Column({ nullable: true })
  cashConfirmedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  @BeforeInsert()
  syncId() {
    if (!this._id && this.id) {
      this._id = this.id;
    }
  }
}
