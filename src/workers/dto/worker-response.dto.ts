import { ApiProperty } from '@nestjs/swagger';

export class WorkerResponseDto {
  @ApiProperty({ example: 1, description: 'Worker ID' })
  id: number;

  @ApiProperty({ example: 'Ahmed Khan', description: 'Worker name' })
  name: string;

  @ApiProperty({ example: '35202-1234567-1', nullable: true, description: 'CNIC' })
  cnic: string | null;

  @ApiProperty({ example: '03001234567', nullable: true, description: 'Phone number' })
  phone: string | null;

  @ApiProperty({ example: 'Machine Operator', nullable: true, description: 'Factory role' })
  role: string | null;

  @ApiProperty({ example: 60000, description: 'Monthly salary' })
  monthlySalary: number;

  @ApiProperty({ example: 15000, description: 'Weekly salary' })
  weeklySalary: number;

  @ApiProperty({ example: 5000, description: 'Pending advance balance' })
  pendingAdvance: number;

  @ApiProperty({ example: '2026-06-01', description: 'Joining date' })
  joiningDate: Date;

  @ApiProperty({ example: true, description: 'Active state' })
  isActive: boolean;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;
}
