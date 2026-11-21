import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  AfterLoad,
  BeforeInsert,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  _id?: string;

  @Column({ nullable: true })
  host_id?: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'host_id' })
  host?: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  start_time?: Date;

  @Column({ type: 'simple-json', nullable: true })
  origin?: any;

  @Column({ type: 'simple-json', nullable: true })
  destination?: any;

  @Column({ type: 'text', nullable: true })
  route_polyline?: string;

  @Column({ type: 'int', default: 1 })
  seats_total: number;

  @Column({ type: 'int', default: 1 })
  seats_available: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @AfterLoad()
  @BeforeInsert()
  syncId() {
    if (!this._id && this.id) {
      this._id = this.id;
    }
  }
}
