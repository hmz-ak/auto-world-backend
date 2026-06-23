import { ApiProperty } from '@nestjs/swagger';
import { AuditLogItemResponseDto } from './audit-log-item-response.dto';
import { ManufacturingItemResponseDto } from './manufacturing-item-response.dto';
import { ManufacturingProcessStepResponseDto } from './manufacturing-process-step-response.dto';

export class ManufacturingProcessSheetResponseDto {
  @ApiProperty({ example: 1, description: 'Process sheet ID' })
  id: number;

  @ApiProperty({ example: 'PS-20260623-0001', description: 'Process sheet number' })
  sheetNumber: string;

  @ApiProperty({ example: 1, description: 'Parent manufacturing record ID' })
  manufacturingRecordId: number;

  @ApiProperty({ example: 'BATCH-20260623-0001', description: 'Parent manufacturing batch number' })
  manufacturingRecordNumber: string;

  @ApiProperty({ example: 1, nullable: true, description: 'Linked purchase order ID' })
  linkedOrderId: number | null;

  @ApiProperty({ example: 'PO-20260623-0001', nullable: true, description: 'Linked purchase order number' })
  linkedOrderNumber: string | null;

  @ApiProperty({ example: 'New Asia', nullable: true, description: 'Manufacturing client name' })
  clientName: string | null;

  @ApiProperty({ example: '2026-06-23', description: 'Production date' })
  productionDate: Date;

  @ApiProperty({ type: [ManufacturingItemResponseDto], description: 'Kamani quantities covered by this sheet' })
  manufacturingItems: ManufacturingItemResponseDto[];

  @ApiProperty({ example: 100, description: 'Total kamani quantity covered by this sheet' })
  quantityProduced: number;

  @ApiProperty({ example: 730, description: 'Total raw material weight for this sheet in kg' })
  totalWeightConsumed: number;

  @ApiProperty({ example: 'PENDING', description: 'Process sheet status' })
  manufacturingStatus: string;

  @ApiProperty({ type: [ManufacturingProcessStepResponseDto], description: 'Process phases for this sheet' })
  processSteps: ManufacturingProcessStepResponseDto[];

  @ApiProperty({ example: false, description: 'Whether this process sheet is fully complete' })
  isReadyForReceipt: boolean;

  @ApiProperty({ type: [AuditLogItemResponseDto], description: 'Raw material consumed by this process sheet' })
  consumedItems: AuditLogItemResponseDto[];

  @ApiProperty({ example: 'First dispatch lot', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ example: '2026-06-23T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;
}
