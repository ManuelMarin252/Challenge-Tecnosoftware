import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { RoleIds, Roles } from '../../api/role/enum/role.enum';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../migration/datasource';

async function seed() {
  console.log('Starting record seeding...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const roleRepository = AppDataSource.getRepository(Role);
  const userRepository = AppDataSource.getRepository(User);

  // 1. Seed Roles
  const rolesData = [
    { id: RoleIds.Customer, name: Roles.Customer },
    { id: RoleIds.Merchant, name: Roles.Merchant },
    { id: RoleIds.Admin, name: Roles.Admin },
  ];

  for (const r of rolesData) {
    const exists = await roleRepository.findOneBy({ id: r.id });
    if (!exists) {
      const role = roleRepository.create(r);
      await roleRepository.save(role);
      console.log(`Role ${r.name} created.`);
    } else {
      console.log(`Role ${r.name} already exists.`);
    }
  }

  // 2. Check if users already exist
  const userCount = await userRepository.count();
  if (userCount > 0) {
    console.log('Database already has users. Skipping user seeding.');
    await AppDataSource.destroy();
    return;
  }

  // 3. Seed Users
  const password = await bcrypt.hash('12345678', 10);

  const adminRole = await roleRepository.findOneBy({ id: RoleIds.Admin });
  const merchantRole = await roleRepository.findOneBy({ id: RoleIds.Merchant });
  const customerRole = await roleRepository.findOneBy({ id: RoleIds.Customer });

  const testUsers = [
    { email: 'admin@admin.com', roles: [adminRole] },
    { email: 'merchant@merchant.com', roles: [merchantRole] },
    { email: 'customer@customer.com', roles: [customerRole] },
  ];

  for (const u of testUsers) {
    const user = userRepository.create({
      email: u.email,
      password: password,
      roles: u.roles,
    });
    await userRepository.save(user);
    console.log(`User ${u.email} created with password: 12345678`);
  }

  console.log('Seeding completed successfully.');
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('Error during seeding:', error);
  process.exit(1);
});
