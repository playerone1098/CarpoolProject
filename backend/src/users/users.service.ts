import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Bookmark } from './entities/bookmark.entity';
import { Brief } from './entities/brief.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Bookmark) private readonly bookmarkRepo: Repository<Bookmark>,
    @InjectRepository(Brief) private readonly briefRepo: Repository<Brief>,
  ) {}

  private normalizeUser(user: User, bookmarks: Bookmark[] = []): any {
    const userObj: any = { ...user };
    userObj._id = user.id;
    userObj.bookmarks = bookmarks.map((b) => ({
      _id: b.id,
      name: b.label,
      address: b.address,
      coords: { lat: b.latitude, lng: b.longitude },
    }));
    return userObj;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(dto);
    const saved = await this.userRepo.save(user);
    saved._id = saved.id;
    return saved;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { phone } });
    if (user) user._id = user.id;
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user) user._id = user.id;
    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepo.find();
    return users.map((u) => {
      u._id = u.id;
      return u;
    });
  }

  async findOne(id: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: [{ id }, { _id: id }],
    });
    if (!user) throw new NotFoundException('User not found');
    const bookmarks = await this.bookmarkRepo.find({ where: { user_id: user.id } });
    return this.normalizeUser(user, bookmarks);
  }

  async update(id: string, dto: UpdateUserDto): Promise<any> {
    const user = await this.userRepo.findOne({
      where: [{ id }, { _id: id }],
    });
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    const bookmarks = await this.bookmarkRepo.find({ where: { user_id: saved.id } });
    return this.normalizeUser(saved, bookmarks);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: [{ id }, { _id: id }],
    });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.delete(user.id);
  }

  async getBookmarks(userId: string): Promise<any[]> {
    const bookmarks = await this.bookmarkRepo.find({ where: { user_id: userId } });
    return bookmarks.map((b) => ({
      _id: b.id,
      name: b.label,
      address: b.address,
      coords: { lat: b.latitude, lng: b.longitude },
    }));
  }

  async addBookmark(userId: string, data: any): Promise<any> {
    const label = data.name || data.label || 'Saved Location';
    const address = data.address || '';
    const lat = data.coords?.lat ?? data.latitude ?? 0;
    const lng = data.coords?.lng ?? data.longitude ?? 0;

    const bookmark = this.bookmarkRepo.create({
      user_id: userId,
      label,
      address,
      latitude: lat,
      longitude: lng,
    });
    const saved = await this.bookmarkRepo.save(bookmark);

    return {
      _id: saved.id,
      name: label,
      address,
      coords: { lat, lng },
    };
  }

  async removeBookmark(userId: string, bookmarkId: string): Promise<void> {
    await this.bookmarkRepo.delete({ id: bookmarkId, user_id: userId });
  }

  async getBriefs(userId: string): Promise<Brief[]> {
    const briefs = await this.briefRepo.find({
      where: { user_id: userId },
      order: { createdAt: 'DESC' },
    });
    return briefs.map((b) => {
      b._id = b.id;
      return b;
    });
  }

  async createBrief(userId: string, data: any): Promise<Brief> {
    const brief = this.briefRepo.create({
      user_id: userId,
      title: data.title,
      type: data.type || 'carpool',
      carpoolResult: data.carpoolResult,
      generalResult: data.generalResult,
      chatLog: data.chatLog,
      timestamp: data.timestamp || new Date().toISOString(),
    });
    const saved = await this.briefRepo.save(brief);
    saved._id = saved.id;
    return saved;
  }

  async removeBrief(userId: string, briefId: string): Promise<void> {
    const result = await this.briefRepo.delete({ id: briefId, user_id: userId });
    if (!result.affected) throw new NotFoundException('Brief not found');
  }

  async clearBriefs(userId: string): Promise<void> {
    await this.briefRepo.delete({ user_id: userId });
  }
}
