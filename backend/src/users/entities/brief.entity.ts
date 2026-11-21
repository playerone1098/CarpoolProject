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
import { User } from './user.entity';

@Entity('briefs')
export class Brief {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  _id?: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.briefs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({ default: 'carpool' })
  type: string;

  @Column({ type: 'simple-json', nullable: true })
  carpoolResult?: any;

  @Column({ type: 'simple-json', nullable: true })
  generalResult?: any;

  @Column({ type: 'text', nullable: true })
  chatLog?: string;

  @Column({ nullable: true })
  timestamp: string;

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
