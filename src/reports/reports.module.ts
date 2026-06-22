import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesModule } from '../expenses/expenses.module';
import { Expense } from '../expenses/entities/expense.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { RevenueEntry } from '../revenue/entities/revenue-entry.entity';
import { RevenueModule } from '../revenue/revenue.module';
import { Worker } from '../workers/entities/worker.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, RevenueEntry, Worker, InventoryItem, PurchaseOrder]),
    ExpensesModule,
    RevenueModule
  ],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
