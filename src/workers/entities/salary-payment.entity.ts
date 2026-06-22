import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Worker } from './worker.entity';

@Entity('salary_payments')
export class SalaryPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Worker, (worker) => worker.salaryPayments, { nullable: false, onDelete: 'CASCADE' })
  worker: Worker;

  @Column({ name: 'payment_date', type: 'date', nullable: false })
  paymentDate: string;

  @Column({ name: 'week_number', type: 'int', nullable: false })
  weekNumber: number;

  @Column({ name: 'gross_amount', type: 'decimal', precision: 12, scale: 2, nullable: false })
  grossAmount: number;

  @Column({ name: 'advance_deducted', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  advanceDeducted: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 12, scale: 2, nullable: false })
  netAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
