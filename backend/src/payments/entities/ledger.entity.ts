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

@Entity('ledgers')
export class Ledger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  _id?: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  paymentId?: string;

  @Column({ nullable: true })
  rideId?: string;

  @Column()
  type: string; // 'credit' | 'debit'

  @Column({ type: 'float' })
  grossAmount: number;

  @Column({ type: 'float', default: 0 })
  platformFee: number;

  @Column({ type: 'float' })
  netAmount: number;

  @Column({ default: 'online' })
  paymentMethod: string;

  @Column({ type: 'text' })
  description: string;

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
