import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  AfterLoad,
  BeforeInsert,
} from 'typeorm';
import { Bookmark } from './bookmark.entity';
import { Brief } from './brief.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Backwards compatibility column/property for frontend MongoDB _id
  @Column({ nullable: true })
  _id?: string;

  @Column({ unique: true })
  phone: string;

  @Column({ default: 'User' })
  name: string;

  @Column({ default: 'unspecified' })
  gender: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: 'free' })
  mode: string;

  @Column({ default: 'seeker' })
  role: string;

  @Column({ default: false })
  isCarOwner: boolean;

  @Column({ nullable: true })
  profilePhoto?: string;

  @Column({ nullable: true })
  fcmToken?: string;

  @Column({ type: 'simple-json', nullable: true })
  homeAddress?: {
    type?: string;
    address: string;
    coords: { lat: number; lng: number };
  };

  @Column({ type: 'simple-json', nullable: true })
  workAddress?: {
    type?: string;
    address: string;
    coords: { lat: number; lng: number };
  };

  @Column({ type: 'simple-json', nullable: true })
  carInfo?: {
    model?: string;
    color?: string;
    plateNumber?: string;
  };

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'simple-json', nullable: true })
  recentRatings?: number[];

  @Column({ type: 'float', default: 500 })
  walletBalance: number;

  @Column({ type: 'float', default: 0 })
  payoutBalance: number;

  @Column({ type: 'simple-json', nullable: true })
  bookmarksList?: Array<{
    _id?: string;
    name: string;
    address: string;
    coords?: { lat: number; lng: number };
    icon?: string;
  }>;

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user, { cascade: true })
  bookmarks?: Bookmark[];

  @OneToMany(() => Brief, (brief) => brief.user, { cascade: true })
  briefs?: Brief[];

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
