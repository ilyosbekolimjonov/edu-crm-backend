import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaidVia } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class PurchasedCourseQueryDto {
  @ApiPropertyOptional({ description: "Foydalanuvchi ID bo'yicha filter" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({ description: "Kurs ID bo'yicha filter" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId?: number;

  @ApiPropertyOptional({
    enum: PaidVia,
    description: "To'lov turi bo'yicha filter",
  })
  @IsOptional()
  @IsEnum(PaidVia)
  paidVia?: PaidVia;
}
