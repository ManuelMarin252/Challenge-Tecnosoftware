import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InventoryService } from '../api/inventory/services/inventory.service';
import { Product } from '../database/entities/product.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const inventoryService = app.get(InventoryService);
  const dataSource = app.get(DataSource);

  const productRepo = dataSource.getRepository(Product);
  const products = await productRepo.find();

  console.log(`Found ${products.length} products. Checking inventory...`);

  for (const product of products) {
    const inventory = await inventoryService.findOneByProduct(product.id);
    if (!inventory) {
      console.log(
        `Creating missing inventory for product ${product.id} (${product.title})`,
      );
      await inventoryService.createInventory(product.id);
    } else {
      console.log(`Inventory exists for product ${product.id}`);
    }
  }

  console.log('Sync complete.');
  await app.close();
}

bootstrap();
