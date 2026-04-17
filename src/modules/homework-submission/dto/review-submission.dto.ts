import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkSubStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class ReviewSubmissionDto {
  @ApiPropertyOptional({
    enum: [HomeworkSubStatus.ACCEPTED, HomeworkSubStatus.REJECTED],
    example: HomeworkSubStatus.ACCEPTED,
    description: 'Ignored by the API. Status is calculated from score.',
  })
  @IsOptional()
  @IsIn([HomeworkSubStatus.ACCEPTED, HomeworkSubStatus.REJECTED])
  status?: HomeworkSubStatus;

  @ApiProperty({ example: 85, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({
    example: 'Kod sifatli yozilgan, ammo testlar yetishmaydi',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  comment?: string;
}
