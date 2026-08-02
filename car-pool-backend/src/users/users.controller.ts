import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // optional: public user creation (used internally by AuthService)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/bookmarks')
  getBookmarks(@Param('id') id: string) {
    return this.usersService.getBookmarks(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/bookmarks')
  addBookmark(@Param('id') id: string, @Body() data: any) {
    return this.usersService.addBookmark(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/bookmarks/:bookmarkId')
  removeBookmark(@Param('id') id: string, @Param('bookmarkId') bookmarkId: string) {
    return this.usersService.removeBookmark(id, bookmarkId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/briefs')
  getBriefs(@Param('id') id: string) {
    return this.usersService.getBriefs(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/briefs')
  createBrief(@Param('id') id: string, @Body() data: any) {
    return this.usersService.createBrief(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/briefs/:briefId')
  removeBrief(@Param('id') id: string, @Param('briefId') briefId: string) {
    return this.usersService.removeBrief(id, briefId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/briefs')
  clearBriefs(@Param('id') id: string) {
    return this.usersService.clearBriefs(id);
  }
}

