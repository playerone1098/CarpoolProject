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

@Entity('chats')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  _id?: string;

  @Column()
  rideId: string;

  @Column()
  senderId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender?: User;

  @Column({ default: 'User' })
  senderName: string;

  @Column({ nullable: true })
  receiverId?: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'receiverId' })
  receiver?: User;

  @Column({ type: 'text' })
  text: string;

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
