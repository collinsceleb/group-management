import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from '../dto/group.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { GroupAdminGuard } from 'src/common/guards/group-admin/group-admin.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('create-group')
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

  @Patch(':id/join-requests/:userId/approve')
  @UseGuards(GroupAdminGuard)
  async approveJoinRequest(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return await this.groupsService.approveJoinRequest(groupId, userId);
  }

  @Patch(':id/join-requests/:userId/reject')
  @UseGuards(GroupAdminGuard)
  async rejectJoinRequest(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return await this.groupsService.rejectJoinRequest(groupId, userId);
  }

  @Get(':id/members')
  @UseGuards(GroupAdminGuard)
  async getGroupMembers(@Param('id') groupId: string) {
    return await this.groupsService.getGroupMembers(groupId);
  }

  @Post(':id/invite-code')
  @UseGuards(GroupAdminGuard)
  async generateInviteCode(@Param('id') groupId: string) {
    return await this.groupsService.generateInviteCode(groupId);
  }

  @Post('join-with-code')
  async joinWithInviteCode(
    @GetUser() user: User,
    @Body('inviteCode') inviteCode: string,
  ) {
    return await this.groupsService.joinWithInviteCode(user.id, inviteCode);
  }

  @Delete(':id/members/:userId')
  @UseGuards(GroupAdminGuard)
  async removeUserFromGroup(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return await this.groupsService.removeUserFromGroup(groupId, userId);
  }
}
