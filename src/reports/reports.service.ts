import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { endOfCurrentMonth, startOfCurrentMonth } from '../common/utils/date.util';
import { toMoney } from '../common/utils/money.util';
import { ExpenseCategory } from '../expenses/constants/expense.constants';
import { Expense } from '../expenses/entities/expense.entity';
import { ExpensesService } from '../expenses/expenses.service';
import { InventoryStatus } from '../inventory/constants/inventory.constants';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { PurchaseOrderStatus } from '../purchase-orders/constants/purchase-order.constants';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { RevenueEntry } from '../revenue/entities/revenue-entry.entity';
import { RevenueService } from '../revenue/revenue.service';
import { Worker } from '../workers/entities/worker.entity';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly revenueService: RevenueService,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(RevenueEntry)
    private readonly revenueRepository: Repository<RevenueEntry>,
    @InjectRepository(Worker)
    private readonly workersRepository: Repository<Worker>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(PurchaseOrder)
    private readonly ordersRepository: Repository<PurchaseOrder>
  ) {}

  async profit(query: ReportQueryDto) {
    const totalRevenue = await this.revenueService.sumBetween(query.startDate, query.endDate);
    const totalRawMaterialCost = await this.expensesService.sumBetween(
      query.startDate,
      query.endDate,
      ExpenseCategory.RAW_MATERIAL
    );
    const totalOperatingExpenses = await this.expensesService.sumBetween(query.startDate, query.endDate);
    const expenseSummary = await this.expensesService.summary({ ...query, page: 1, limit: 100 });
    const grossProfit = toMoney(totalRevenue - totalRawMaterialCost);
    const netProfit = toMoney(grossProfit - totalOperatingExpenses);

    return {
      dateRange: { from: query.startDate ?? null, to: query.endDate ?? null },
      totalRevenue,
      totalRawMaterialCost,
      grossProfit,
      totalOperatingExpenses,
      netProfit,
      expenseBreakdown: expenseSummary.byCategory
    };
  }

  async dashboardSummary() {
    const startDate = startOfCurrentMonth();
    const endDate = endOfCurrentMonth();
    const revenueThisMonth = await this.revenueService.sumBetween(startDate, endDate);
    const expensesThisMonth = await this.expensesService.sumBetween(startDate, endDate);
    const activeWorkers = await this.workersRepository.count({ where: { isActive: true } });
    const pendingOrders = await this.ordersRepository.count({ where: { status: PurchaseOrderStatus.PENDING } });
    const inventoryItemsLowStock = await this.inventoryRepository.count({ where: { status: InventoryStatus.LOW_STOCK } });
    const inventoryItemsOutOfStock = await this.inventoryRepository.count({ where: { status: InventoryStatus.OUT_OF_STOCK } });
    const salaryRow = await this.workersRepository
      .createQueryBuilder('worker')
      .select('COALESCE(SUM(worker.weeklySalary), 0)', 'total')
      .where('worker.isActive = true')
      .getRawOne<{ total: string }>();

    return {
      revenueThisMonth,
      expensesThisMonth,
      netProfitThisMonth: toMoney(revenueThisMonth - expensesThisMonth),
      activeWorkers,
      totalSalaryDueThisSaturday: toMoney(salaryRow?.total ?? 0),
      inventoryItemsLowStock,
      inventoryItemsOutOfStock,
      pendingOrders
    };
  }

  async monthlySeries(query: ReportQueryDto) {
    const revenueRows = await this.revenueRepository
      .createQueryBuilder('revenue')
      .select("TO_CHAR(revenue.revenueDate, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(revenue.amount), 0)', 'revenue')
      .where(query.startDate ? 'revenue.revenueDate >= :startDate' : '1=1', { startDate: query.startDate })
      .andWhere(query.endDate ? 'revenue.revenueDate <= :endDate' : '1=1', { endDate: query.endDate })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; revenue: string }>();
    const expenseRows = await this.expensesRepository
      .createQueryBuilder('expense')
      .select("TO_CHAR(expense.expenseDate, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'expenses')
      .where(query.startDate ? 'expense.expenseDate >= :startDate' : '1=1', { startDate: query.startDate })
      .andWhere(query.endDate ? 'expense.expenseDate <= :endDate' : '1=1', { endDate: query.endDate })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; expenses: string }>();
    const monthMap = new Map<string, { month: string; revenue: number; expenses: number }>();
    revenueRows.forEach((row) => monthMap.set(row.month, { month: row.month, revenue: toMoney(row.revenue), expenses: 0 }));
    expenseRows.forEach((row) => {
      const existing = monthMap.get(row.month) ?? { month: row.month, revenue: 0, expenses: 0 };
      monthMap.set(row.month, { ...existing, expenses: toMoney(row.expenses) });
    });
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }
}
