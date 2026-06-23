import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import {
  InventoryCategory,
  InventoryRawMaterialSize,
  InventoryStatus,
  InventoryUnit
} from '../constants/inventory.constants';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  @Index()
  @Column({ type: 'enum', enum: InventoryCategory, nullable: false })
  category: InventoryCategory;

  @Column({ type: 'enum', enum: InventoryUnit, nullable: false })
  unit: InventoryUnit;

  @Column({
    name: 'raw_material_size',
    type: 'enum',
    enum: InventoryRawMaterialSize,
    nullable: true
  })
  rawMaterialSize: InventoryRawMaterialSize | null;

  @Column({ name: 'total_quantity', type: 'decimal', precision: 12, scale: 2, nullable: false })
  totalQuantity: number;

  @Column({ name: 'available_quantity', type: 'decimal', precision: 12, scale: 2, nullable: false })
  availableQuantity: number;

  @Column({ name: 'consumed_quantity', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  consumedQuantity: number;

  @Column({ name: 'purchase_price_per_unit', type: 'decimal', precision: 12, scale: 2, nullable: false })
  purchasePricePerUnit: number;

  @Index()
  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.AVAILABLE, nullable: false })
  status: InventoryStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
