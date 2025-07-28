import { EnergyLevel } from '@prisma/client';
export declare class CreateUserSettingsDto {
    morningEnergyLevel?: EnergyLevel;
    afternoonEnergyLevel?: EnergyLevel;
    workStartTime?: string;
    workEndTime?: string;
    focusSessionLength?: number;
}
export declare class UpdateUserSettingsDto extends CreateUserSettingsDto {
}
export declare class UserSettingsResponseDto extends CreateUserSettingsDto {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
