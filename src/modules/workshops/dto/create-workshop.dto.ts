import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Arenosa Via 40', description: 'Workshop name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Via 40 corridor', description: 'Area of the city' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location: string;

  @ApiProperty({ example: 'Via 40 # 45-21', description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiProperty({ example: 'Barranquilla', description: 'City' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: true, description: 'Whether the branch is still operating', required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}