import { ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkSubStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class SubmissionQueryDto {
  @ApiPropertyOptional({ description: "Homework ID bo'yicha filter" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  homeworkId?: number;

  @ApiPropertyOptional({ description: "Talaba (User) ID bo'yicha filter" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({
    enum: HomeworkSubStatus,
    description: "Status bo'yicha filter",
  })
  @IsOptional()
  @IsEnum(HomeworkSubStatus)
  status?: HomeworkSubStatus;
}
