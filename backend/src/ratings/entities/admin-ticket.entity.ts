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

@Entity('admin_tickets')
export class AdminTicket {
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
  reporterId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'reporterId' })
  reporter?: User;

  @Column()
  subjectId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'subjectId' })
  subject?: User;

  @Column({ nullable: true })
  ratingId?: string;

  @Column({ type: 'simple-json', nullable: true })
  safetyTags: string[];

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: 'HIGH' })
  severity: string;

  @Column({ default: 'OPEN' })
  status: string;

  @Column({ type: 'text' })
  reason: string;

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
