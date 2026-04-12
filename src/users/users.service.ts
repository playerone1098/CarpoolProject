import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { Bookmark } from './bookmark.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bookmark.name) private bookmarkModel: Model<Bookmark>
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = new this.userModel(dto);
    return user.save();
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('User not found');
  }

  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return this.bookmarkModel.find({ user_id: userId }).exec();
  }

  async addBookmark(userId: string, data: Partial<Bookmark>): Promise<Bookmark> {
    const bookmark = new this.bookmarkModel({ ...data, user_id: userId });
    return bookmark.save();
  }

  async removeBookmark(userId: string, bookmarkId: string): Promise<void> {
    const result = await this.bookmarkModel.findOneAndDelete({ _id: bookmarkId, user_id: userId }).exec();
    if (!result) throw new NotFoundException('Bookmark not found');
  }
}

