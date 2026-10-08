import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express'; // 1. Importáljuk az Express beépített típusát

// 2. Definiáljuk, hogy pontosan mit ad vissza a JwtStrategy validate() függvénye
export interface RequestUser {
  id: number;
  email: string;
}

export const GetUser = createParamDecorator(
  // A data paraméterrel akár egy konkrét mezőt is lekérhetünk (pl. @GetUser('id'))
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    // 3. Megmondjuk a TypeScriptnek, hogy ez egy Express Request lesz
    const request = ctx.switchToHttp().getRequest<Request>();

    // 4. A request.user-t biztosítjuk arról, hogy a mi RequestUser típusunkat használja
    const user = request.user as RequestUser;

    // 5. Ha kértünk egy konkrét mezőt, azt adjuk vissza, különben az egész user objektumot
    return data ? user?.[data] : user;
  },
);
