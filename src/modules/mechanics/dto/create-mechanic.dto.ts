import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Maria Rojas', description: 'Mechanic full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '12345678', description: 'National id document' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  document: string;

  @ApiProperty({ example: '3001234567', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: 'maria.rojas@arenosa.example', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: true, description: 'Whether the mechanic is active', required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}