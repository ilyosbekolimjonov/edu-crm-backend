import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({
    example:
      'Async/await - bu Promise bilan ishlashni soddalashtiradigan sintaksis.',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
