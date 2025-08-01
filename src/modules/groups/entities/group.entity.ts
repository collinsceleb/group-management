import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id',
    primaryKeyConstraintName: 'groups_pkey',
  })
  id: string;

  @Column('varchar', { length: 255, nullable: false, unique: true })
  name: string;
  @Column('text', { nullable: false })
  description: string;
  @Column('int', { nullable: false })
  capacity: number;

  @Column('enum', { enum: Visibility, default: Visibility.PUBLIC })
  visibility: Visibility;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false })
  admin: User;

  @Column('varchar', { length: 8, nullable: true, unique: true })
  inviteCode: string;

  @OneToMany(() => User, (user) => user.group)
  users: User[];
}
