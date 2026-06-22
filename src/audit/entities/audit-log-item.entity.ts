import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { AuditLog } from './audit-log.entity';

@Entity('audit_log_items')
export class AuditLogItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AuditLog, (auditLog) => auditLog.items, { nullable: false, onDelete: 'CASCADE' })
  auditLog: AuditLog;

  @ManyToOne(() => InventoryItem, { nullable: false })
  inventoryItem: InventoryItem;

  @Column({ name: 'quantity_consumed', type: 'decimal', precision: 12, scale: 2, nullable: false })
  quantityConsumed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
