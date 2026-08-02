import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { Bookmark } from './bookmark.schema';
import { Brief } from './brief.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bookmark.name) private bookmarkModel: Model<Bookmark>,
    @InjectModel(Brief.name) private briefModel: Model<Brief>
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = new this.userModel(dto);
    return user.save();
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    const bookmarks = await this.bookmarkModel.find({ user_id: id }).exec();
    const userObj: any = user.toObject();
    userObj.bookmarks = bookmarks.map(b => ({
      _id: b._id,
      name: b.label,
      address: b.address,
      coords: { lat: b.latitude, lng: b.longitude }
    }));
    return userObj;
  }

  async update(id: string, dto: UpdateUserDto): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    const bookmarks = await this.bookmarkModel.find({ user_id: id }).exec();
    const userObj: any = user.toObject();
    userObj.bookmarks = bookmarks.map(b => ({
      _id: b._id,
      name: b.label,
      address: b.address,
      coords: { lat: b.latitude, lng: b.longitude }
    }));
    return userObj;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('User not found');
  }

  async getBookmarks(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }
    const bookmarks = await this.bookmarkModel.find({ user_id: userId }).exec();
    return bookmarks.map(b => ({
      _id: b._id,
      name: b.label,
      address: b.address,
      coords: { lat: b.latitude, lng: b.longitude }
    }));
  }

  async addBookmark(userId: string, data: any): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const label = data.name || data.label || 'Saved Location';
    const address = data.address;
    const lat = data.coords?.lat ?? data.latitude ?? 0;
    const lng = data.coords?.lng ?? data.longitude ?? 0;

    const bookmark = new this.bookmarkModel({
      user_id: userId,
      label: label,
      address: address,
      latitude: lat,
      longitude: lng,
    });
    const saved = await bookmark.save();

    const bmObj = {
      _id: saved._id,
      name: label,
      address: address,
      coords: { lat, lng }
    };

    await this.userModel.findByIdAndUpdate(userId, {
      $push: { bookmarks: bmObj }
    }).exec();

    return bmObj;
  }

  async removeBookmark(userId: string, bookmarkId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookmarkId)) {
      throw new NotFoundException('Bookmark not found');
    }
    await this.bookmarkModel.findOneAndDelete({ _id: bookmarkId, user_id: userId }).exec();
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { bookmarks: { _id: bookmarkId } }
    }).exec();
  }

  async getBriefs(userId: string): Promise<Brief[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }
    return this.briefModel.find({ user_id: userId }).sort({ createdAt: -1 }).exec();
  }

  async createBrief(userId: string, data: any): Promise<Brief> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const brief = new this.briefModel({
      user_id: userId,
      title: data.title,
      type: data.type || 'carpool',
      carpoolResult: data.carpoolResult,
      generalResult: data.generalResult,
      chatLog: data.chatLog,
      timestamp: data.timestamp || new Date().toISOString(),
    });
    return brief.save();
  }

  async removeBrief(userId: string, briefId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(briefId)) {
      throw new NotFoundException('Brief not found');
    }
    const result = await this.briefModel.findOneAndDelete({ _id: briefId, user_id: userId }).exec();
    if (!result) throw new NotFoundException('Brief not found');
  }

  async clearBriefs(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }
    await this.briefModel.deleteMany({ user_id: userId }).exec();
  }
}
