import { ApiProperty } from '@nestjs/swagger';

export class ExpenseResponseDto {
  @ApiProperty({ example: 1, description: 'Expense ID' })
  id: number;

  @ApiProperty({ example: 'FUEL', description: 'Expense category' })
  category: string;

  @ApiProperty({ example: 'QUENCHING_OIL', nullable: true, description: 'Expense subcategory' })
  subCategory: string | null;

  @ApiProperty({ example: 'Furnace fuel purchase', description: 'Description' })
  description: string;

  @ApiProperty({ example: 25000, description: 'Expense amount' })
  amount: number;

  @ApiProperty({ example: '2026-06-22', description: 'Expense date' })
  expenseDate: Date;

  @ApiProperty({ example: 'Paid in cash', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Updated timestamp' })
  updatedAt: Date;
}
