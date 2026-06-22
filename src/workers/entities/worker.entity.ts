import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { AdvancePayment } from './advance-payment.entity';
import { SalaryPayment } from './salary-payment.entity';

@Entity('workers')
export class Worker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
  cnic: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  role: string | null;

  @Column({ name: 'monthly_salary', type: 'decimal', precision: 12, scale: 2, nullable: false })
  monthlySalary: number;

  @Column({ name: 'weekly_salary', type: 'decimal', precision: 12, scale: 2, nullable: false })
  weeklySalary: number;

  @Column({ name: 'pending_advance', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: false })
  pendingAdvance: number;

  @Column({ name: 'joining_date', type: 'date', nullable: false })
  joiningDate: string;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @OneToMany(() => AdvancePayment, (advance) => advance.worker)
  advances: AdvancePayment[];

  @OneToMany(() => SalaryPayment, (payment) => payment.worker)
  salaryPayments: SalaryPayment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
