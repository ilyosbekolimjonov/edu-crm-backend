import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaidVia } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePurchasedCourseDto {
  @ApiPropertyOptional({
    example: 1500000,
    description: "Yangi to'langan summa",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: PaidVia })
  @IsOptional()
  @IsEnum(PaidVia)
  paidVia?: PaidVia;

  @ApiPropertyOptional({ example: 1, description: 'Mentor ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  mentorId?: number;
}
