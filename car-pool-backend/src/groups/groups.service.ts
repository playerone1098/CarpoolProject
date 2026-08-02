import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from './group.schema';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
  ) {}

  async create(dto: CreateGroupDto, userId?: string): Promise<Group> {
    const groupData: any = { ...dto };
    if (userId) {
      groupData.createdBy = new Types.ObjectId(userId);
      groupData.members = [new Types.ObjectId(userId)];
    }
    const group = new this.groupModel(groupData);
    return group.save();
  }

  async findAll(): Promise<Group[]> {
    return this.groupModel.find().populate('members createdBy').exec();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupModel.findById(id).populate('members createdBy').exec();
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const updated = await this.groupModel.findByIdAndUpdate(id, dto, { new: true }).populate('members createdBy').exec();
    if (!updated) throw new NotFoundException('Group not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Group not found');
  }

  async addMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) throw new NotFoundException('Group not found');
    
    const userObjId = new Types.ObjectId(userId);
    if (!group.members.some(m => m.toString() === userId)) {
      group.members.push(userObjId);
      await group.save();
    }
    return group.populate('members createdBy');
  }

  async removeMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) throw new NotFoundException('Group not found');

    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();
    return group.populate('members createdBy');
  }
}
