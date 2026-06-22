import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseOrder, (order) => order.items, { nullable: false, onDelete: 'CASCADE' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'product_name', type: 'varchar', length: 150, nullable: false })
  productName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, nullable: false })
  unitPrice: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, nullable: false })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
