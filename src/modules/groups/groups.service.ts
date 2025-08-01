import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Visibility } from './entities/group.entity';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from '../dto/group.dto';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async createGroup(createGroupDto: CreateGroupDto): Promise<Group> {
    const { name, visibility, capacity, description } = createGroupDto;
    const existingGroup = await this.groupRepository.findOne({
      where: { name },
    });
    if (existingGroup) {
      throw new BadRequestException('Group with this name already exists');
    }
    const group = this.groupRepository.create({
      name,
      visibility,
      capacity,
      description,
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
