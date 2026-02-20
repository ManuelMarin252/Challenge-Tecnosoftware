import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToMany,
} from 'typeorm';
import type { User } from './user.entity';

@Entity()
export class Role {
  @PrimaryColumn()
  public id!: number;

  @Column({ type: 'varchar', length: 120, unique: true })
  public name: string;

  @ManyToMany(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => (require('./user.entity') as any).User,
    (user) => user.roles,
  )
  public users: User[];

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  public updatedAt!: Date;
}
