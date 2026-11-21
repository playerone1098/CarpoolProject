import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SeedService } from './src/database/seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeedService);

  console.log('🌱 Seeding PostgreSQL database with offline local mock data...');
  await seeder.seedAll();
  console.log('✅ Offline local mock data seeded successfully!');

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Error during database seeding:', error);
  process.exit(1);
});
