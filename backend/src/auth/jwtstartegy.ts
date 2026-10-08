import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly databaseService: DatabaseService) {
    super({
      // Honnan szedje ki a tokent? A Header-ből (Bearer)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'A_TE_SZUPER_TITKOS_KULCSOD', // Ezt majd .env fájlba tedd! (.env.JWT_SECRET)
    });
  }

  // Ez a payload az, amit a login-nál a tokenbe kódoltunk
  async validate(payload: { sub: number; email: string }) {
    // Lekérdezzük a Prismával a usert a tokenben lévő ID alapján
    const user = await this.databaseService.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
      },
    });

    // Ha a usert időközben törölték (vagy pl. bannolták)
    if (!user) {
      throw new UnauthorizedException('Unauthorized access!');
    }

    // Ha minden rendben, visszaadjuk. Ez kerül a req.user-be!
    return user;
  }
}
