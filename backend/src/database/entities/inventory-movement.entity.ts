import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import type { User } from './user.entity';

export enum InventoryMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

@Entity()
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public productId!: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  public product!: Product;

  @Column({ type: 'int' })
  public quantity!: number;

  @Column({
    type: 'enum',
    enum: InventoryMovementType,
  })
  public type!: InventoryMovementType;

  @Column({ type: 'varchar', length: 255 })
  public reason!: string;

  @Column({ nullable: true })
  public userId!: number;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  @ManyToOne(() => (require('./user.entity') as any).User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  public user?: User;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt!: Date;
}
