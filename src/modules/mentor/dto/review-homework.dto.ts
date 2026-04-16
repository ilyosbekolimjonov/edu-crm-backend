import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { trimString } from '../../../common/validation/helpers';

export class ReviewHomeworkDto {
  @ApiProperty({
    enum: ['ACCEPTED', 'REJECTED'],
    example: 'ACCEPTED',
    description: 'Homework natijasi',
  })
  @IsIn(['ACCEPTED', 'REJECTED'], {
    message: "Status faqat ACCEPTED yoki REJECTED bo'lishi mumkin",
  })
  status: 'ACCEPTED' | 'REJECTED';

  @ApiPropertyOptional({
    example: "Yaxshi ishlandi, lekin yana bir nechta nuqtaga e'tibor bering",
    description: "Izoh (REJECTED bo'lganda majburiy)",
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  reason?: string;
}
