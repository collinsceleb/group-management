import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CheckUserDto, CreateUserDto } from '../dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isEmail } from 'class-validator';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from 'src/common/class/jwt-payload/jwt-payload';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_EXPIRATION_TIME: number;
  private readonly JWT_REFRESH_EXPIRATION_TIME: number;
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly datasource: DataSource,
  ) {
    this.JWT_ACCESS_EXPIRATION_TIME =
      this.configService.get('JWT_ACCESS_EXPIRATION_TIME') * 1000;
    this.JWT_REFRESH_EXPIRATION_TIME =
      this.configService.get('JWT_EXPIRATION_TIME') * 1000;
  }
  async register(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email, password, confirmPassword, phoneNumber, fullName } =
        createUserDto;
      if (!isEmail(email)) {
        throw new BadRequestException('Invalid email format');
      }
      if (password !== confirmPassword) {
        throw new BadRequestException('Password does not match');
      }
      await this.checkUserExists({ email });
      const user = queryRunner.manager.create(User, {
        email,
        password: password,
        phoneNumber,
        fullName,
        emailAddress: email,
      });
      await user.hashPassword();
      await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error registering user', error);
      throw new InternalServerErrorException(
        'An error occurred while registering the user. Please check server logs for details.',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      await queryRunner.release();
    }
  }
  async checkUserExists(checkUserDto: CheckUserDto): Promise<boolean> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { email } = checkUserDto;
      const emailCheck = await queryRunner.manager.findOne(User, {
        where: { emailAddress: email },
      });
      if (emailCheck) {
        throw new BadRequestException('Email already exists');
      }
      await queryRunner.commitTransaction();
      return false;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Error checking user existence',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      await queryRunner.release();
    }
  }
  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const accessJwtId = crypto.randomUUID();
      const payload: JwtPayload = {
        sub: user.id as unknown as User,
        email: user.emailAddress,
        jwtId: accessJwtId,
      };
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: `${this.JWT_ACCESS_EXPIRATION_TIME}ms`,
      });
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: `${this.JWT_REFRESH_EXPIRATION_TIME}ms`,
      });
      await queryRunner.commitTransaction();
      return {
        accessToken,
        refreshToken,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.error('Error generating tokens:', e);
      throw new InternalServerErrorException(
        'An error occurred while generating tokens. Please check server logs for details.',
        e.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
