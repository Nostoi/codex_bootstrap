import { AuthService } from "./auth.service";
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(email: string): Promise<{
        access_token: string;
    }>;
}
