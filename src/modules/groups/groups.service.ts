import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Visibility } from './entities/group.entity';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from '../dto/group.dto';
import { Group } from './entities/group.entity';
import { User } from '../users/entities/user.entity';
import { JoinRequest, JoinRequestStatus } from './entities/join-request.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(JoinRequest)
    private readonly joinRequestRepository: Repository<JoinRequest>,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    adminId: string,
  ): Promise<Group> {
    const { name, visibility, capacity, description } = createGroupDto;
    const existingGroup = await this.groupRepository.findOne({
      where: { name },
    });
    if (existingGroup) {
      throw new BadRequestException('Group with this name already exists');
    }

    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    const group = this.groupRepository.create({
      name,
      visibility,
      capacity,
      description,
      admin,
    });
    return await this.groupRepository.save(group);
  }

  async searchPublicGroups(name: string): Promise<Group[]> {
    return await this.groupRepository.find({
      where: {
        name: Like(`%${name}%`),
        visibility: Visibility.PUBLIC,
      },
      take: 10,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async requestToJoinGroup(
    userId: string,
    groupId: string,
  ): Promise<{ message: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.visibility !== Visibility.PUBLIC) {
      throw new BadRequestException('Can only request to join public groups');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.group) {
      throw new BadRequestException('User is already in a group');
    }

    const existingRequest = await this.joinRequestRepository.findOne({
      where: {
        user: { id: userId },
        group: { id: groupId },
        status: JoinRequestStatus.PENDING,
      },
    });
    if (existingRequest) {
      throw new BadRequestException('Join request already pending');
    }

    const joinRequest = this.joinRequestRepository.create({ user, group });
    await this.joinRequestRepository.save(joinRequest);

    return { message: 'Join request submitted successfully' };
  }

  async getPendingJoinRequests(groupId: string): Promise<JoinRequest[]> {
    return await this.joinRequestRepository.find({
      where: { group: { id: groupId }, status: JoinRequestStatus.PENDING },
      relations: ['user'],
    });
  }

  async approveJoinRequest(requestId: string): Promise<{ message: string }> {
    const joinRequest = await this.joinRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'group', 'group.users'],
    });

    if (!joinRequest) {
      throw new NotFoundException('Join request not found');
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('Join request is not pending');
    }

    if (joinRequest.group.users.length >= joinRequest.group.capacity) {
      throw new BadRequestException('Group is at full capacity');
    }

    joinRequest.user.group = joinRequest.group;
    joinRequest.status = JoinRequestStatus.APPROVED;

    await this.userRepository.save(joinRequest.user);
    await this.joinRequestRepository.save(joinRequest);

    return { message: 'Join request approved successfully' };
  }

  async rejectJoinRequest(requestId: string): Promise<{ message: string }> {
    const joinRequest = await this.joinRequestRepository.findOne({
      where: { id: requestId },
    });
    if (!joinRequest) {
      throw new NotFoundException('Join request not found');
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('Join request is not pending');
    }

    joinRequest.status = JoinRequestStatus.REJECTED;
    await this.joinRequestRepository.save(joinRequest);

    return { message: 'Join request rejected successfully' };
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group.users;
  }

  async generateInviteCode(groupId: string): Promise<{ inviteCode: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.visibility !== Visibility.PRIVATE) {
      throw new BadRequestException('Invite codes are only for private groups');
    }

    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    group.inviteCode = inviteCode;
    await this.groupRepository.save(group);

    return { inviteCode };
  }

  async joinWithInviteCode(
    userId: string,
    inviteCode: string,
  ): Promise<{ message: string }> {
    const group = await this.groupRepository.findOne({
      where: { inviteCode },
      relations: ['users'],
    });
    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }

    if (group.users.length >= group.capacity) {
      throw new BadRequestException('Group is at full capacity');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.group) {
      throw new BadRequestException('User is already in a group');
    }

    user.group = group;
    await this.userRepository.save(user);

    return { message: 'Successfully joined the group' };
  }

  async removeUserFromGroup(
    groupId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['group'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.group || user.group.id !== groupId) {
      throw new BadRequestException('User is not in this group');
    }

    await this.userRepository.update(userId, { group: null });

    return { message: 'User removed from group successfully' };
  }
}
