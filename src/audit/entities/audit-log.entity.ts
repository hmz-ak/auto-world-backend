import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { ManufacturingProcessStepStatus, ManufacturingRecordStatus } from '../constants/manufacturing.constants';
import { AuditLogItem } from './audit-log-item.entity';
import { ManufacturingProcessSheet } from './manufacturing-process-sheet.entity';

export interface ManufacturingItemSnapshot {
  kamaniType: string;
  quantity: number;
  unitWeight: number;
  totalWeight: number;
}

export interface ManufacturingProcessStepSnapshot {
  phase: string;
  label: string;
  status: ManufacturingProcessStepStatus;
  startedAt: string | null;
  completedAt: string | null;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_number', type: 'varchar', length: 50, unique: true, nullable: false })
  batchNumber: string;

  @Column({ name: 'product_produced', type: 'varchar', length: 150, nullable: false })
  productProduced: string;

  @Column({ name: 'quantity_produced', type: 'decimal', precision: 12, scale: 2, nullable: false })
  quantityProduced: number;

  @Column({ name: 'production_date', type: 'date', nullable: false })
  productionDate: string;

  @ManyToOne(() => PurchaseOrder, { nullable: true })
  linkedOrder: PurchaseOrder | null;

  @ManyToOne(() => Client, { nullable: true })
  client: Client | null;

  @Column({ name: 'manufacturing_items', type: 'jsonb', nullable: true })
  manufacturingItems: ManufacturingItemSnapshot[] | null;

  @Column({ name: 'total_weight_consumed', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  totalWeightConsumed: number;

  @Column({
    name: 'manufacturing_status',
    type: 'enum',
    enum: ManufacturingRecordStatus,
    default: ManufacturingRecordStatus.PENDING,
    nullable: false
  })
  manufacturingStatus: ManufacturingRecordStatus;

  @Column({ name: 'process_steps', type: 'jsonb', nullable: true })
  processSteps: ManufacturingProcessStepSnapshot[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => AuditLogItem, (item) => item.auditLog, { cascade: true })
  items: AuditLogItem[];

  @OneToMany(() => ManufacturingProcessSheet, (processSheet) => processSheet.manufacturingRecord)
  processSheets: ManufacturingProcessSheet[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
