import { ApiProperty } from '@nestjs/swagger';
import { AuditLogItemResponseDto } from './audit-log-item-response.dto';
import { ManufacturingItemResponseDto } from './manufacturing-item-response.dto';

export class AuditLogResponseDto {
  @ApiProperty({ example: 1, description: 'Audit log ID' })
  id: number;

  @ApiProperty({ example: 'BATCH-20260622-0001', description: 'Batch number' })
  batchNumber: string;

  @ApiProperty({ example: '4-Patti Kamani', description: 'Product produced' })
  productProduced: string;

  @ApiProperty({ example: 50, description: 'Quantity produced' })
  quantityProduced: number;

  @ApiProperty({ example: '2026-06-22', description: 'Production date' })
  productionDate: Date;

  @ApiProperty({ example: 1, nullable: true, description: 'Linked purchase order ID' })
  linkedOrderId: number | null;

  @ApiProperty({ example: 'PO-20260622-0001', nullable: true, description: 'Linked purchase order number' })
  linkedOrderNumber: string | null;

  @ApiProperty({ example: 1, nullable: true, description: 'Manufacturing client ID' })
  clientId: number | null;

  @ApiProperty({ example: 'New Asia', nullable: true, description: 'Manufacturing client name' })
  clientName: string | null;

  @ApiProperty({ type: [ManufacturingItemResponseDto], description: 'Manufactured kamani lines' })
  manufacturingItems: ManufacturingItemResponseDto[];

  @ApiProperty({ example: 10325, description: 'Total raw material weight consumed in kg' })
  totalWeightConsumed: number;

  @ApiProperty({ example: 'Day shift batch', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ type: [AuditLogItemResponseDto], description: 'Consumed inventory items' })
  consumedItems: AuditLogItemResponseDto[];

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;
}
