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

@Entity('ratings')
export class Rating {
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
  reviewerId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'reviewerId' })
  reviewer?: User;

  @Column()
  revieweeId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'revieweeId' })
  reviewee?: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: false })
  isSafetyIssue: boolean;

  @Column({ default: false })
  isSkipped: boolean;

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
