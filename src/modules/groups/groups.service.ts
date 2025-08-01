import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Visibility } from './entities/group.entity';
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
    try {
      const { name, visibility, capacity, description } = createGroupDto;
      const existingGroup = await this.groupRepository.findOne({
        where: { name },
      });
      if (existingGroup) {
        throw new BadRequestException('Group with this name already exists');
      }

      const admin = await this.userRepository.findOne({
        where: { id: adminId },
      });
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create group');
    }
  }

  async searchPublicGroups(name: string): Promise<Group[]> {
    try {
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search groups');
    }
  }

  async requestToJoinGroup(
    userId: string,
    groupId: string,
  ): Promise<{ message: string }> {
    try {
      const group = await this.groupRepository.findOne({
        where: { id: groupId },
        relations: ['admin'],
      });
      if (!group) {
        throw new NotFoundException('Group not found');
      }

      if (group.admin.id === userId) {
        throw new BadRequestException(
          'Group admin cannot join their own group',
        );
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to submit join request');
    }
  }

  async getPendingJoinRequests(groupId: string): Promise<JoinRequest[]> {
    try {
      return await this.joinRequestRepository.find({
        where: { group: { id: groupId }, status: JoinRequestStatus.PENDING },
        relations: ['user'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get pending join requests',
      );
    }
  }

  async approveJoinRequest(
    groupId: string,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      const joinRequest = await this.joinRequestRepository.findOne({
        where: {
          user: { id: userId },
          group: { id: groupId },
          status: JoinRequestStatus.PENDING,
        },
        relations: ['user', 'group', 'group.users'],
      });

      if (!joinRequest) {
        throw new NotFoundException('Join request not found');
      }

      if (joinRequest.group.users.length >= joinRequest.group.capacity) {
        throw new BadRequestException('Group is at full capacity');
      }

      joinRequest.user.group = joinRequest.group;
      joinRequest.status = JoinRequestStatus.APPROVED;

      await this.userRepository.save(joinRequest.user);
      await this.joinRequestRepository.save(joinRequest);

      return { message: 'Join request approved successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to approve join request');
    }
  }

  async rejectJoinRequest(
    groupId: string,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      const joinRequest = await this.joinRequestRepository.findOne({
        where: {
          user: { id: userId },
          group: { id: groupId },
          status: JoinRequestStatus.PENDING,
        },
      });
      if (!joinRequest) {
        throw new NotFoundException('Join request not found');
      }

      joinRequest.status = JoinRequestStatus.REJECTED;
      await this.joinRequestRepository.save(joinRequest);

      return { message: 'Join request rejected successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to reject join request');
    }
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    try {
      const group = await this.groupRepository.findOne({
        where: { id: groupId },
        relations: ['users'],
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      return group.users;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get group members');
    }
  }

  async generateInviteCode(groupId: string): Promise<{ inviteCode: string }> {
    try {
      const group = await this.groupRepository.findOne({
        where: { id: groupId },
      });
      if (!group) {
        throw new NotFoundException('Group not found');
      }

      if (group.visibility !== Visibility.PRIVATE) {
        throw new BadRequestException(
          'Invite codes are only for private groups',
        );
      }

      const inviteCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      group.inviteCode = inviteCode;
      await this.groupRepository.save(group);

      return { inviteCode };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate invite code');
    }
  }

  async joinWithInviteCode(
    userId: string,
    inviteCode: string,
  ): Promise<{ message: string }> {
    try {
      const group = await this.groupRepository.findOne({
        where: { inviteCode },
        relations: ['users', 'admin'],
      });
      if (!group) {
        throw new NotFoundException('Invalid invite code');
      }

      if (group.admin.id === userId) {
        throw new BadRequestException(
          'Group admin cannot join their own group',
        );
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to join group with invite code',
      );
    }
  }

  async removeUserFromGroup(
    groupId: string,
    userId: string,
  ): Promise<{ message: string }> {
    try {
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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove user from group',
      );
    }
  }
}
