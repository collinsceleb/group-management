import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Visibility } from '../groups/entities/group.entity';

export class CreateGroupDto {
  @ApiProperty({ example: 'JavaScript Developers', description: 'Group name (must be unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A group for JavaScript developers to share knowledge', description: 'Group description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 50, description: 'Maximum number of members', minimum: 1 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ enum: Visibility, example: Visibility.PUBLIC, description: 'Group visibility' })
  @IsEnum(Visibility)
  visibility: Visibility;
}