import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkSubStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewSubmissionDto {
  @ApiProperty({ enum: HomeworkSubStatus, example: HomeworkSubStatus.APPROVED })
  @IsEnum(HomeworkSubStatus)
  status: HomeworkSubStatus;

  @ApiPropertyOptional({
    example: 'Kod sifatli yozilgan, ammo testlar yetishmaydi',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;
}
