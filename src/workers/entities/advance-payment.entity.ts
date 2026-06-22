import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Worker } from './worker.entity';

@Entity('advance_payments')
export class AdvancePayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Worker, (worker) => worker.advances, { nullable: false, onDelete: 'CASCADE' })
  worker: Worker;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'taken_on', type: 'date', nullable: false })
  takenOn: string;

  @Column({ name: 'is_deducted', type: 'boolean', default: false, nullable: false })
  isDeducted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
