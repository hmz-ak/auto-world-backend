import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty({ example: true, description: 'Whether the record was deleted' })
  deleted: boolean;
}
