import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaidVia } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePurchasedCourseDto {
  @ApiProperty({ example: 1, description: 'Foydalanuvchi ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId: number;

  @ApiProperty({ example: 1, description: 'Kurs ID' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId: number;

  @ApiPropertyOptional({ example: 1500000, description: "To'langan summa" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ enum: PaidVia, example: PaidVia.CASH })
  @IsEnum(PaidVia)
  paidVia: PaidVia;

  @ApiPropertyOptional({ example: 1, description: 'Mentor ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  mentorId?: number;
}
