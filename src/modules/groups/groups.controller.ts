import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from '../dto/group.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { GroupAdminGuard } from 'src/common/guards/group-admin/group-admin.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @GetUser() user: User,
  ) {
    return await this.groupsService.createGroup(createGroupDto, user.id);
  }

  @Get('search')
  async searchPublicGroups(@Query('name') name: string) {
    return await this.groupsService.searchPublicGroups(name);
  }

  @Post(':id/join')
  async requestToJoinGroup(
    @GetUser() user: User,
    @Param('id') groupId: string,
  ) {
    return await this.groupsService.requestToJoinGroup(user.id, groupId);
  }

  @Get(':id/join-requests')
  @UseGuards(GroupAdminGuard)
  async getPendingJoinRequests(@Param('id') groupId: string) {
    return await this.groupsService.getPendingJoinRequests(groupId);
  }

  @Post('join-requests/:requestId/approve')
  @UseGuards(GroupAdminGuard)
  async approveJoinRequest(@Param('requestId') requestId: string) {
    return await this.groupsService.approveJoinRequest(requestId);
  }

  @Post('join-requests/:requestId/reject')
  @UseGuards(GroupAdminGuard)
  async rejectJoinRequest(@Param('requestId') requestId: string) {
    return await this.groupsService.rejectJoinRequest(requestId);
  }

  @Get(':id/members')
  @UseGuards(GroupAdminGuard)
  async getGroupMembers(@Param('id') groupId: string) {
    return await this.groupsService.getGroupMembers(groupId);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(+id);
  }
}
