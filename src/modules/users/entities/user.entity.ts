import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as argon2 from 'argon2';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({
    name: 'id',
    primaryKeyConstraintName: 'PK_user_id',
  })
  id: number;

  @Column('varchar', { length: 255, nullable: false, unique: true })
  emailAddress: string;

  @Column('varchar', { length: 255, nullable: false })
  @Exclude()
  password: string;

  @Column({ name: 'full_name', nullable: false })
  fullName: string;

  @Column({ name: 'phone_number', nullable: false })
  @Column({ name: 'phone_number', nullable: false, unique: true })
  phoneNumber: string;
  @Column({ name: 'last_login', nullable: true, type: 'timestamptz' })
  lastLogin: Date;
  async hashPassword(): Promise<void> {
    this.password = await argon2.hash(this.password);
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return await argon2.verify(this.password, plainPassword);
  }
}
