import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ClientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: true, description: 'Filter by active state' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
