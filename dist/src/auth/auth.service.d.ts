import { UsersService } from "../users/users.service";
export declare class AuthService {
    private readonly users;
    constructor(users: UsersService);
    validateUser(email: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(email: string): Promise<{
        access_token: string;
    }>;
}
