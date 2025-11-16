import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from './group.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(@InjectModel(Group.name) private groupModel: Model<Group>) {}

  async create(dto: CreateGroupDto): Promise<Group> {
    const group = new this.groupModel(dto);
    return group.save();
  }

  async findAll(): Promise<Group[]> {
    return this.groupModel.find().populate('members').populate('createdBy').exec();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupModel.findById(id).populate('members').exec();
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async remove(id: string): Promise<void> {
    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Group not found');
  }

  async addMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupModel.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: new Types.ObjectId(userId) } },
      { new: true }
    ).populate('members');
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async removeMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupModel.findByIdAndUpdate(
      groupId,
      { $pull: { members: new Types.ObjectId(userId) } },
      { new: true }
    ).populate('members');
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }
}
