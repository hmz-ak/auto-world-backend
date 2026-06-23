import { ApiProperty } from '@nestjs/swagger';

export class ManufacturingProcessStepResponseDto {
  @ApiProperty({ example: 'BLANK_CUTTING', description: 'Manufacturing process phase key' })
  phase: string;

  @ApiProperty({ example: 'Blank cutting', description: 'Manufacturing process phase label' })
  label: string;

  @ApiProperty({ example: 'PENDING', description: 'Process phase status' })
  status: string;

  @ApiProperty({ example: '2026-06-23T11:00:00.000Z', nullable: true, description: 'Phase started timestamp' })
  startedAt: string | null;

  @ApiProperty({ example: '2026-06-23T13:00:00.000Z', nullable: true, description: 'Phase completed timestamp' })
  completedAt: string | null;
}
