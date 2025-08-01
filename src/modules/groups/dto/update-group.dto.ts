import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from '../../dto/group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
