import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'titkos_kulcs_fejleszteshez',
      signOptions: { expiresIn: '1d' }, // A token lejárati ideje, pl. 1 nap
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
