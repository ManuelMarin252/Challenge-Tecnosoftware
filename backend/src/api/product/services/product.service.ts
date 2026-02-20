import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { CreateProductDto, ProductDetailsDto } from '../dto/product.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductCreatedEvent } from '../events/product-created.event';
import { Category } from '../../../database/entities/category.entity';
import { Product } from 'src/database/entities/product.entity';
import { errorMessages } from 'src/errors/custom';
import { validate } from 'class-validator';
import { successObject } from 'src/common/helper/sucess-response.interceptor';
import { plainToInstance } from 'class-transformer';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProduct(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
    });

    if (!product) throw new NotFoundException(errorMessages.product.notFound);

    return product;
  }

  async createProduct(data: CreateProductDto, merchantId: number) {
    const category = await this.entityManager.findOne(Category, {
      where: {
        id: data.categoryId,
      },
    });

    if (!category) throw new NotFoundException(errorMessages.category.notFound);

    const product = await this.entityManager.create(Product, {
      ...data,
      category,
      merchantId,
    });

    const savedProduct = await this.entityManager.save(product);

    this.eventEmitter.emit(
      'product.created',
      new ProductCreatedEvent(savedProduct.id, merchantId),
    );

    return savedProduct;
  }

  async updateProduct(productId: number, data: UpdateProductDto) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
      relations: ['category'],
    });

    if (!product) throw new NotFoundException(errorMessages.product.notFound);

    if (data.categoryId) {
      const category = await this.entityManager.findOne(Category, {
        where: { id: data.categoryId },
      });
      if (!category)
        throw new NotFoundException(errorMessages.category.notFound);
      product.category = category;
      product.categoryId = data.categoryId;
    }

    Object.assign(product, data);

    return this.entityManager.save(product);
  }

  async addProductDetails(
    productId: number,
    body: ProductDetailsDto,
    merchantId: number,
  ) {
    const result = await this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        ...body,
      })
      .where('id = :id', { id: productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .returning(['id'])
      .execute();
    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);
    return result.raw[0];
  }

  async activateProduct(productId: number, merchantId: number) {
    const errors = await this.validate(productId);
    if (errors.length > 0) {
      throw new ConflictException({
        message: errorMessages.product.notFulfilled.message,
        errors: errors,
      });
    }

    const result = await this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        isActive: true,
      })
      .where('id = :id', { id: productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .returning(['id', 'isActive'])
      .execute();

    return result.raw[0];
  }

  async validate(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(errorMessages.product.notFound);
    const productInstance = plainToInstance(Product, product);
    return await validate(productInstance);
  }

  async findAll(includeInactive = false, includeDeleted = false) {
    const query = this.entityManager
      .createQueryBuilder(Product, 'product')
      .leftJoinAndSelect('product.category', 'category');

    if (includeDeleted) {
      query.withDeleted();
    }

    if (!includeInactive) {
      query.where('product.isActive = :isActive', { isActive: true });
    }

    // If includeDeleted is true, we might want to also see inactive ones,
    // or keep the filter specific.
    // Usually admin viewing deleted items wants to see everything.

    return query.getMany();
  }

  async deactivateProduct(productId: number, merchantId: number) {
    const result = await this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({ isActive: false })
      .where('id = :productId', { productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .execute();

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    return successObject;
  }

  async deleteProduct(productId: number, merchantId: number) {
    // Soft delete using TypeORM's softDelete
    const result = await this.entityManager.softDelete(Product, {
      id: productId,
      merchantId,
    });

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    return successObject;
  }

  async restoreProduct(productId: number, merchantId: number) {
    const result = await this.entityManager.restore(Product, {
      id: productId,
      merchantId,
    });

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    return successObject;
  }
}
