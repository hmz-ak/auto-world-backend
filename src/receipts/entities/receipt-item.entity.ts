import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Receipt } from './receipt.entity';

@Entity('receipt_items')
export class ReceiptItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Receipt, (receipt) => receipt.items, { nullable: false, onDelete: 'CASCADE' })
  receipt: Receipt;

  @Column({ type: 'varchar', length: 200, nullable: false })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, nullable: false })
  unitPrice: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, nullable: false })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
