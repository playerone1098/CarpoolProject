import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findByPhone(phone: string) {
    return this.repo.findOne({ where: { phone } });
  }

  async createUser(phone: string) {
    const u = this.repo.create({ phone });
    return this.repo.save(u);
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
