import { EnergyLevel } from "@prisma/client";

export class CreateUserSettingsDto {
  morningEnergyLevel?: EnergyLevel;
  afternoonEnergyLevel?: EnergyLevel;
  workStartTime?: string;
  workEndTime?: string;
  focusSessionLength?: number;
}

export class UpdateUserSettingsDto extends CreateUserSettingsDto {}

export class UserSettingsResponseDto extends CreateUserSettingsDto {
  id!: string;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
