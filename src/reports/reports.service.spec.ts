import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseCategory } from '../expenses/constants/expense.constants';
import { Expense } from '../expenses/entities/expense.entity';
import { ExpensesService } from '../expenses/expenses.service';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { RevenueEntry } from '../revenue/entities/revenue-entry.entity';
import { RevenueService } from '../revenue/revenue.service';
import { Worker } from '../workers/entities/worker.entity';
import { ReportsService } from './reports.service';

function createRepositoryMock() {
  return {
    count: jest.fn(),
    createQueryBuilder: jest.fn()
  };
}

describe('ReportsService', () => {
  let service: ReportsService;
  let expensesService: { sumBetween: jest.Mock; summary: jest.Mock };
  let revenueService: { sumBetween: jest.Mock };
  let workersRepository: ReturnType<typeof createRepositoryMock>;
  let inventoryRepository: ReturnType<typeof createRepositoryMock>;
  let ordersRepository: ReturnType<typeof createRepositoryMock>;

  beforeEach(async () => {
    expensesService = {
      sumBetween: jest.fn(),
      summary: jest.fn()
    };
    revenueService = {
      sumBetween: jest.fn()
    };
    workersRepository = createRepositoryMock();
    inventoryRepository = createRepositoryMock();
    ordersRepository = createRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ExpensesService, useValue: expensesService },
        { provide: RevenueService, useValue: revenueService },
        { provide: getRepositoryToken(Expense), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(RevenueEntry), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(Worker), useValue: workersRepository },
        { provide: getRepositoryToken(InventoryItem), useValue: inventoryRepository },
        { provide: getRepositoryToken(PurchaseOrder), useValue: ordersRepository }
      ]
    }).compile();

    service = module.get(ReportsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate grossProfit as totalRevenue minus totalRawMaterialCost', async () => {
    revenueService.sumBetween.mockResolvedValue(500000);
    expensesService.sumBetween.mockResolvedValueOnce(150000).mockResolvedValueOnce(300000);
    expensesService.summary.mockResolvedValue({ byCategory: [] });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.grossProfit).toBe(350000);
  });

  it('should calculate netProfit as grossProfit minus totalOperatingExpenses', async () => {
    revenueService.sumBetween.mockResolvedValue(500000);
    expensesService.sumBetween.mockResolvedValueOnce(150000).mockResolvedValueOnce(300000);
    expensesService.summary.mockResolvedValue({ byCategory: [] });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.netProfit).toBe(50000);
  });

  it('should include every expense category that has entries in the breakdown', async () => {
    revenueService.sumBetween.mockResolvedValue(500000);
    expensesService.sumBetween.mockResolvedValueOnce(150000).mockResolvedValueOnce(300000);
    expensesService.summary.mockResolvedValue({
      byCategory: [
        { category: ExpenseCategory.RAW_MATERIAL, total: 150000 },
        { category: ExpenseCategory.FUEL, total: 75000 },
        { category: ExpenseCategory.WAGES, total: 75000 }
      ]
    });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.expenseBreakdown).toEqual([
      { category: ExpenseCategory.RAW_MATERIAL, total: 150000 },
      { category: ExpenseCategory.FUEL, total: 75000 },
      { category: ExpenseCategory.WAGES, total: 75000 }
    ]);
  });

  it('should return the requested dateRange in the response', async () => {
    revenueService.sumBetween.mockResolvedValue(500000);
    expensesService.sumBetween.mockResolvedValueOnce(150000).mockResolvedValueOnce(300000);
    expensesService.summary.mockResolvedValue({ byCategory: [] });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.dateRange).toEqual({ from: '2026-06-01', to: '2026-06-30' });
  });

  it('should return zeroes when there is no revenue or expenses data', async () => {
    revenueService.sumBetween.mockResolvedValue(0);
    expensesService.sumBetween.mockResolvedValue(0);
    expensesService.summary.mockResolvedValue({ byCategory: [] });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report).toMatchObject({
      totalRevenue: 0,
      totalRawMaterialCost: 0,
      grossProfit: 0,
      totalOperatingExpenses: 0,
      netProfit: 0,
      expenseBreakdown: []
    });
  });

  it('should return negative netProfit correctly when expenses exceed revenue', async () => {
    revenueService.sumBetween.mockResolvedValue(100000);
    expensesService.sumBetween.mockResolvedValueOnce(50000).mockResolvedValueOnce(200000);
    expensesService.summary.mockResolvedValue({ byCategory: [{ category: ExpenseCategory.FUEL, total: 200000 }] });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.grossProfit).toBe(50000);
    expect(report.netProfit).toBe(-150000);
  });

  it('should exclude workers already paid for this Saturday from dashboard salary due', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 24, 12));
    revenueService.sumBetween.mockResolvedValue(100000);
    expensesService.sumBetween.mockResolvedValue(25000);
    workersRepository.count.mockResolvedValue(3);
    ordersRepository.count.mockResolvedValue(2);
    inventoryRepository.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    const salaryQuery = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '24000' })
    };
    workersRepository.createQueryBuilder.mockReturnValue(salaryQuery);

    const summary = await service.dashboardSummary();

    expect(summary.totalSalaryDueThisSaturday).toBe(24000);
    expect(salaryQuery.leftJoin).toHaveBeenCalledWith(
      'worker.salaryPayments',
      'salaryPayment',
      'salaryPayment.paymentDate = :salaryPaymentDate',
      { salaryPaymentDate: '2026-06-27' }
    );
    expect(salaryQuery.andWhere).toHaveBeenCalledWith('salaryPayment.id IS NULL');
  });
});
