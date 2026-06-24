import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesModule } from '../expenses/expenses.module';
import { AdvancePayment } from './entities/advance-payment.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { Worker } from './entities/worker.entity';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Worker, AdvancePayment, SalaryPayment]), ExpensesModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService, TypeOrmModule]
})
export class WorkersModule {}
