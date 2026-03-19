import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

// ADMIN/SUPERADMIN to'liq yangilasa, MENTOR faqat o'z kursini tahrirlaydi
// mentorId o'zgartirish faqat ADMIN/SUPERADMIN uchun — service da tekshiriladi
export class UpdateCourseDto extends PartialType(
  OmitType(CreateCourseDto, [] as const),
) {}
