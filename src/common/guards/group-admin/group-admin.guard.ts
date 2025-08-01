import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../../../modules/groups/entities/group.entity';
import { Request } from 'express';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class GroupAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const groupId = request.params.id;

    if (!user || !groupId) {
      throw new ForbiddenException('Access denied');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['admin'],
    });

    if (!group) {
      throw new ForbiddenException('Group not found');
    }

    if (group.admin.id !== user.id) {
      throw new ForbiddenException('Only group admin can access this resource');
    }

    return true;
  }
}
