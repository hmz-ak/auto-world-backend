import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  InventoryCategory,
  InventoryStatus
} from '../constants/inventory.constants';

export class InventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InventoryStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ enum: InventoryCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(InventoryCategory)
  category?: InventoryCategory;
}
