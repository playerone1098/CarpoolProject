import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../users/entities/user.entity';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private normalizeGroup(group: Group): Group {
    if (!group) return group;
    group._id = group.id;
    if (group.createdBy) group.createdBy._id = group.createdBy.id;
    if (group.members && Array.isArray(group.members)) {
      group.members.forEach((m) => {
        if (m) m._id = m.id;
      });
    }
    return group;
  }

  async create(dto: CreateGroupDto, userId?: string): Promise<Group> {
    let creator: User | null = null;
    if (userId) {
      creator = await this.userRepo.findOne({
        where: [{ id: userId }, { _id: userId }],
      });
    }

    const group = this.groupRepo.create({
      name: dto.name,
      description: (dto as any).description,
      icon: (dto as any).icon,
      createdById: creator ? creator.id : undefined,
      createdBy: creator || undefined,
      members: creator ? [creator] : [],
    });

    const saved = await this.groupRepo.save(group);
    return this.normalizeGroup(saved);
  }

  async findAll(): Promise<Group[]> {
    const groups = await this.groupRepo.find({
      relations: ['members', 'createdBy'],
    });
    return groups.map((g) => this.normalizeGroup(g));
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: [{ id }, { _id: id }],
      relations: ['members', 'createdBy'],
    });
    if (!group) throw new NotFoundException('Group not found');
    return this.normalizeGroup(group);
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: [{ id }, { _id: id }],
      relations: ['members', 'createdBy'],
    });
    if (!group) throw new NotFoundException('Group not found');

    Object.assign(group, dto);
    const updated = await this.groupRepo.save(group);
    return this.normalizeGroup(updated);
  }

  async remove(id: string): Promise<void> {
    const group = await this.groupRepo.findOne({
      where: [{ id }, { _id: id }],
    });
    if (!group) throw new NotFoundException('Group not found');
    await this.groupRepo.delete(group.id);
  }

  async addMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: [{ id: groupId }, { _id: groupId }],
      relations: ['members', 'createdBy'],
    });
    if (!group) throw new NotFoundException('Group not found');

    const user = await this.userRepo.findOne({
      where: [{ id: userId }, { _id: userId }],
    });
    if (!user) throw new NotFoundException('User not found');

    group.members = group.members || [];
    if (!group.members.some((m) => m.id === user.id || m._id === user.id)) {
      group.members.push(user);
      await this.groupRepo.save(group);
    }

    return this.normalizeGroup(group);
  }

  async removeMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: [{ id: groupId }, { _id: groupId }],
      relations: ['members', 'createdBy'],
    });
    if (!group) throw new NotFoundException('Group not found');

    group.members = (group.members || []).filter(
      (m) => m.id !== userId && m._id !== userId,
    );
    await this.groupRepo.save(group);

    return this.normalizeGroup(group);
  }
}
