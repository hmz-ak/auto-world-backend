import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { PurchaseOrderStatus } from '../constants/purchase-order.constants';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true, nullable: false })
  orderNumber: string;

  @Index()
  @ManyToOne(() => Client, { nullable: false })
  client: Client;

  @Column({ name: 'order_date', type: 'date', nullable: false })
  orderDate: string;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: string | null;

  @Index()
  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.PENDING, nullable: false })
  status: PurchaseOrderStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
