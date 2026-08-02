import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateGroupDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.groupsService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/add-member/:userId')
  addMember(@Param('id') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.addMember(groupId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/remove-member/:userId')
  removeMember(@Param('id') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(groupId, userId);
  }
}
