import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { ManufacturingRecordStatus } from '../constants/manufacturing.constants';
import { AuditLogItem } from './audit-log-item.entity';
import {
  AuditLog,
  ManufacturingItemSnapshot,
  ManufacturingProcessStepSnapshot
} from './audit-log.entity';

@Entity('manufacturing_process_sheets')
export class ManufacturingProcessSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sheet_number', type: 'varchar', length: 60, unique: true, nullable: false })
  sheetNumber: string;

  @ManyToOne(() => AuditLog, (auditLog) => auditLog.processSheets, { nullable: false, onDelete: 'CASCADE' })
  manufacturingRecord: AuditLog;

  @Column({ name: 'production_date', type: 'date', nullable: false })
  productionDate: string;

  @Column({ name: 'manufacturing_items', type: 'jsonb', nullable: false })
  manufacturingItems: ManufacturingItemSnapshot[];

  @Column({ name: 'quantity_produced', type: 'decimal', precision: 12, scale: 2, nullable: false })
  quantityProduced: number;

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

  @Column({ name: 'process_steps', type: 'jsonb', nullable: false })
  processSteps: ManufacturingProcessStepSnapshot[];

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => AuditLogItem, (item) => item.processSheet)
  consumedItems: AuditLogItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
