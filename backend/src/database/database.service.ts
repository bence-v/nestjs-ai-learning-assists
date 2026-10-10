import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'; // A hivatalos Postgres Node.js driver
import { PrismaPg } from '@prisma/adapter-pg'; // A Prisma adaptere a pg-hez

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    const pool = new Pool({ connectionString });

    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      console.log('✅ Prisma (PG Adapterrel) sikeresen csatlakozott!');
    } catch (e) {
      console.log('❌ Prisma hiba:', e);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
