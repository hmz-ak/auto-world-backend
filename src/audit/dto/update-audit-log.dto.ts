import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAuditLogDto {
  @ApiPropertyOptional({ example: 'Updated notes', description: 'Notes only' })
  @IsOptional()
  @IsString()
  notes?: string;
}
