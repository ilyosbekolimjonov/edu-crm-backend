import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewHomeworkDto {
    @ApiProperty({
        enum: ['APPROVED', 'REJECTED'],
        example: 'APPROVED',
        description: 'Homework natijasi',
    })
    @IsIn(['APPROVED', 'REJECTED'], {
        message: "Status faqat APPROVED yoki REJECTED bo'lishi mumkin",
    })
    status: 'APPROVED' | 'REJECTED';

    @ApiPropertyOptional({
        example: "Yaxshi ishlandi, lekin yana bir nechta nuqtaga e'tibor bering",
        description: "Izoh (REJECTED bo'lganda majburiy)",
    })
    @IsOptional()
    @IsString()
    reason?: string;
}
