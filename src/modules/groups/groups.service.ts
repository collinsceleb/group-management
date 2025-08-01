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

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async joinGroup(
    userId: string,
    groupId: string,
  ): Promise<{ message: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.visibility !== Visibility.PUBLIC) {
      throw new BadRequestException('Can only join public groups');
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

  findAll() {
    return `This action returns all groups`;
  }

  findOne(id: number) {
    return `This action returns a #${id} group`;
  }

  update(id: number, updateGroupDto: UpdateGroupDto) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
