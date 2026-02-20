import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import {
  ProductDetails,
  ProductDetailsTypeFn,
} from 'src/api/product/dto/productDetails';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import type { User } from './user.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  @IsDefined()
  @IsNumber()
  public id!: number;

  @Column({ type: 'varchar', nullable: true })
  @IsDefined()
  @IsString()
  @Index()
  public code: string;

  @Column({ type: 'varchar', nullable: true })
  @IsDefined()
  @IsString()
  public title: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsString()
  public variationType: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  public description?: string | null;

  @Column({ type: 'text', array: true, default: [] })
  @IsOptional()
  @IsString({ each: true })
  public about?: string[];

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @Type(ProductDetailsTypeFn)
  @ValidateNested()
  public details: Partial<ProductDetails> | null;

  @Column({ default: false })
  public isActive: boolean;

  @Column({ type: 'int', nullable: true })
  @IsDefined()
  @IsNumber()
  public merchantId: number;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => (require('./user.entity') as any).User,
    (user) => user.products,
  )
  @JoinColumn({ name: 'merchantId' })
  public merchant: User;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  public category: Category;

  @Column({ type: 'int', nullable: true })
  @IsDefined()
  @IsNumber()
  public categoryId: number;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  public updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  public deletedAt?: Date;
}

export enum VariationTypes {
  NONE = 'NONE',
  OnlySize = 'OnlySize',
  OnlyColor = 'OnlyColor',
  SizeAndColor = 'SizeAndColor',
}
export const variationTypesKeys = Object.keys(VariationTypes);
