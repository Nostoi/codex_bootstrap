import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { sign } from "./jwt.util";

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  async validateUser(email: string) {
    const user = await this.users.findByEmail(email);
    return user;
  }

  async login(email: string) {
    let user = await this.users.findByEmail(email);
    if (!user) {
      user = await this.users.create({ email });
    }
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: sign(payload, process.env.JWT_SECRET || "changeme"),
    };
  }
}
