import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PurchaseOrderStatus } from '../constants/purchase-order.constants';

export class PurchaseOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PurchaseOrderStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional({ example: 1, description: 'Filter by client ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;
}
