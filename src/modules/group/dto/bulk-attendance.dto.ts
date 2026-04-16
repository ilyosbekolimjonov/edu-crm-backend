import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkAttendanceChangeDto {
  @ApiProperty({ example: 4, description: 'Student userId' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: 2, description: 'Month day' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  day: number;

  @ApiProperty({ example: true, nullable: true })
  @IsIn([true, false, null], {
    message: "present true, false yoki null bo'lishi kerak",
  })
  present: boolean | null;
}

export class BulkAttendanceDto {
  @ApiProperty({ example: '2026-04' })
  @Matches(/^\d{4}-\d{2}$/, { message: "Oy YYYY-MM formatida bo'lishi kerak" })
  month: string;

  @ApiProperty({ type: [BulkAttendanceChangeDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceChangeDto)
  changes: BulkAttendanceChangeDto[];
}
