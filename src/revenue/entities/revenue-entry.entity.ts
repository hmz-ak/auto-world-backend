import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Receipt } from '../../receipts/entities/receipt.entity';

@Entity('revenue_entries')
export class RevenueEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, { nullable: true })
  client: Client | null;

  @ManyToOne(() => Receipt, { nullable: true })
  receipt: Receipt | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  description: string;

  @Index()
  @Column({ name: 'revenue_date', type: 'date', nullable: false })
  revenueDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
