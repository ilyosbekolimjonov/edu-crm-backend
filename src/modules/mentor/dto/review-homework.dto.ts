import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class ReviewHomeworkDto {
  @ApiPropertyOptional({
    enum: ['ACCEPTED', 'REJECTED'],
    example: 'ACCEPTED',
    description: 'Ignored by the API. Status is calculated from score.',
  })
  @IsOptional()
  @IsIn(['ACCEPTED', 'REJECTED'], {
    message: "Status faqat ACCEPTED yoki REJECTED bo'lishi mumkin",
  })
  status?: 'ACCEPTED' | 'REJECTED';

  @ApiProperty({ example: 85, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({
    example: "Yaxshi ishlandi, lekin yana bir nechta nuqtaga e'tibor bering",
    description: 'Izoh',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    example: "Yaxshi ishlandi, lekin yana bir nechta nuqtaga e'tibor bering",
    description: 'Legacy comment field. Prefer comment.',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  reason?: string;
}
