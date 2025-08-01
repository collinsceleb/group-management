import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: 'MyPassword123!', description: 'User password (min 12 chars, uppercase, number, special char)' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Password must contain at least one special character',
  })
  @Matches(/^\S*$/, { message: 'Password must not contain spaces' })
  password: string;

  @ApiProperty({ example: 'MyPassword123!', description: 'Confirm password (must match password)' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(12, {
    message: 'Confirm password must be at least 12 characters long',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Confirm password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[0-9])/, {
    message: 'Confirm password must contain at least one number',
  })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Confirm password must contain at least one special character',
  })
  confirmPassword: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  fullName: string;

  @ApiProperty({ example: '01234567890', description: 'Phone number (11 digits starting with 0)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^0/, {
    message: 'Phone number must start with 0',
  })
  @Matches(/^\d{11}$/, {
    message: 'Phone number must be exactly 11 digits',
  })
  phoneNumber: string;
}

export class CheckUserDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'MyPassword123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}