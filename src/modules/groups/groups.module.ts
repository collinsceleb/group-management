import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from './entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupAdminGuard } from 'src/common/guards/group-admin/group-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Group, User])],
  controllers: [GroupsController],
  providers: [GroupsService, GroupAdminGuard],
  exports: [TypeOrmModule, GroupsService],
})
export class GroupsModule {}
