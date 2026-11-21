import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🧹 Purging all data from the database...');

  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear().catch(async () => {
      await dataSource.query(`DELETE FROM "${entity.tableName}";`).catch(() => {});
    });
  }

  console.log('✅ Database clear completed!');
  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Error during database clearing:', error);
  process.exit(1);
});
