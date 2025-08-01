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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from '../dto/group.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { GroupAdminGuard } from 'src/common/guards/group-admin/group-admin.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CreateGroupDto })
  @Post('create-group')
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @GetUser() user: User,
  ) {
    return await this.groupsService.createGroup(createGroupDto, user.id);
  }

  @ApiOperation({ summary: 'Search public groups by name' })
  @ApiResponse({ status: 200, description: 'Groups found successfully' })
  @ApiQuery({ name: 'name', description: 'Group name to search for' })
  @Get('search')
  async searchPublicGroups(@Query('name') name: string) {
    return await this.groupsService.searchPublicGroups(name);
  }

  @ApiOperation({ summary: 'Request to join a public group' })
  @ApiResponse({
    status: 201,
    description: 'Join request submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @Post(':id/join')
  async requestToJoinGroup(
    @GetUser() user: User,
    @Param('id') groupId: string,
  ) {
    return await this.groupsService.requestToJoinGroup(user.id, groupId);
  }

  @ApiOperation({
    summary: 'Get pending join requests for a group (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending requests retrieved successfully',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @Get(':id/join-requests')
  @UseGuards(GroupAdminGuard)
  async getPendingJoinRequests(@Param('id') groupId: string) {
    return await this.groupsService.getPendingJoinRequests(groupId);
  }

  @ApiOperation({ summary: 'Approve a join request (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Join request approved successfully',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Patch(':id/join-requests/:userId/approve')
  @UseGuards(GroupAdminGuard)
  async approveJoinRequest(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return await this.groupsService.approveJoinRequest(groupId, userId);
  }

  @ApiOperation({ summary: 'Reject a join request (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Join request rejected successfully',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Patch(':id/join-requests/:userId/reject')
  @UseGuards(GroupAdminGuard)
  async rejectJoinRequest(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return await this.groupsService.rejectJoinRequest(groupId, userId);
  }

  @ApiOperation({ summary: 'Get all group members (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Group members retrieved successfully',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @Get(':id/members')
  @UseGuards(GroupAdminGuard)
  async getGroupMembers(@Param('id') groupId: string) {
    return await this.groupsService.getGroupMembers(groupId);
  }

  @ApiOperation({
    summary: 'Generate invite code for private group (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Invite code generated successfully',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @Post(':id/invite-code')
  @UseGuards(GroupAdminGuard)
  async generateInviteCode(@Param('id') groupId: string) {
    return await this.groupsService.generateInviteCode(groupId);
  }

  @ApiOperation({ summary: 'Join a private group using invite code' })
  @ApiResponse({ status: 201, description: 'Successfully joined the group' })
  @ApiResponse({
    status: 400,
    description: 'Invalid invite code or user already in group',
  })
  @ApiBody({ schema: { properties: { inviteCode: { type: 'string' } } } })
  @Post('join-with-code')
  async joinWithInviteCode(
    @GetUser() user: User,
    @Body('inviteCode') inviteCode: string,
  ) {
    return await this.groupsService.joinWithInviteCode(user.id, inviteCode);
  }

  @ApiOperation({ summary: 'Remove user from group (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User removed from group successfully',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @Delete(':id/members/:userId')
  @UseGuards(GroupAdminGuard)
  async removeUserFromGroup(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return await this.groupsService.removeUserFromGroup(groupId, userId);
  }
}
