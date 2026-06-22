import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { AuditLogItem } from './audit-log-item.entity';

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

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => AuditLogItem, (item) => item.auditLog, { cascade: true })
  items: AuditLogItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
