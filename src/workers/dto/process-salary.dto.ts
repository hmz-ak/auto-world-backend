import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ProcessSalaryDto {
  @ApiPropertyOptional({ example: true, description: 'Allow processing outside Saturday for testing' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
