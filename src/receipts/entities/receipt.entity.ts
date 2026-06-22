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
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { ReceiptItem } from './receipt-item.entity';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'receipt_number', type: 'varchar', length: 50, unique: true, nullable: false })
  receiptNumber: string;

  @Index()
  @ManyToOne(() => Client, { nullable: false })
  client: Client;

  @ManyToOne(() => PurchaseOrder, { nullable: true })
  purchaseOrder: PurchaseOrder | null;

  @Column({ name: 'issue_date', type: 'date', nullable: false })
  issueDate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  subtotal: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, nullable: false })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => ReceiptItem, (item) => item.receipt, { cascade: true })
  items: ReceiptItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
