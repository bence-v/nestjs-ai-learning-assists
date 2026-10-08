import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'; // A hivatalos Postgres Node.js driver
import { PrismaPg } from '@prisma/adapter-pg'; // A Prisma adaptere a pg-hez

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Kiolvassuk az adatbázis URL-t a környezeti változókból
    const connectionString = process.env.DATABASE_URL;

    // 2. Létrehozunk egy kapcsolat-készletet (Pool) a sima 'pg' driverrel
    const pool = new Pool({ connectionString });

    // 3. Ezt a poolt átadjuk a Prisma adapternek
    const adapter = new PrismaPg(pool);

    // 4. Végül inicializáljuk a PrismaClient-et (a super hívással) az adapterrel!
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

  // Jó gyakorlat lezárni a kapcsolatot, amikor a modul (vagy a szerver) leáll
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
