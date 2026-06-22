import { PartialType } from '@nestjs/swagger';
import { CreateRevenueEntryDto } from './create-revenue-entry.dto';

export class UpdateRevenueEntryDto extends PartialType(CreateRevenueEntryDto) {}
