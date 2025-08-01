import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Visibility } from '../groups/entities/group.entity';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(Visibility)
  visibility: Visibility;
}