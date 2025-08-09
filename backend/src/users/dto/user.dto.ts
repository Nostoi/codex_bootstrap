import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User full name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
