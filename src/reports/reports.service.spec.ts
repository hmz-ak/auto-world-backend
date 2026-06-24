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
  let expensesService: {
    sumBetween: jest.Mock;
    sumExcludingCategories: jest.Mock;
    sumForCategories: jest.Mock;
    sumBySubCategory: jest.Mock;
    summary: jest.Mock;
  };
  let revenueService: { sumBetween: jest.Mock };
  let expensesRepository: ReturnType<typeof createRepositoryMock>;
  let workersRepository: ReturnType<typeof createRepositoryMock>;
  let inventoryRepository: ReturnType<typeof createRepositoryMock>;
  let ordersRepository: ReturnType<typeof createRepositoryMock>;

  beforeEach(async () => {
    expensesService = {
      sumBetween: jest.fn(),
      sumExcludingCategories: jest.fn(),
      sumForCategories: jest.fn(),
      sumBySubCategory: jest.fn(),
      summary: jest.fn()
    };
    revenueService = {
      sumBetween: jest.fn()
    };
    expensesRepository = createRepositoryMock();
    workersRepository = createRepositoryMock();
    inventoryRepository = createRepositoryMock();
    ordersRepository = createRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ExpensesService, useValue: expensesService },
        { provide: RevenueService, useValue: revenueService },
        { provide: getRepositoryToken(Expense), useValue: expensesRepository },
        { provide: getRepositoryToken(RevenueEntry), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(Worker), useValue: workersRepository },
        { provide: getRepositoryToken(InventoryItem), useValue: inventoryRepository },
        { provide: getRepositoryToken(PurchaseOrder), useValue: ordersRepository }
      ]
    }).compile();

    service = module.get(ReportsService);
  });

  function mockProfitInputs({
    revenue = 500000,
    totalExpenses = 450000,
    rawMaterialCost = 150000,
    operatingExpenses = 300000,
    rawMaterialBreakdown = [],
    byCategory = []
  }: {
    revenue?: number;
    totalExpenses?: number;
    rawMaterialCost?: number;
    operatingExpenses?: number;
    rawMaterialBreakdown?: Array<{ category: string; total: number }>;
    byCategory?: Array<{ category: ExpenseCategory; total: number }>;
  } = {}) {
    revenueService.sumBetween.mockResolvedValue(revenue);
    expensesService.sumBetween.mockResolvedValue(totalExpenses);
    expensesService.sumForCategories.mockResolvedValue(rawMaterialCost);
    expensesService.sumExcludingCategories.mockResolvedValue(operatingExpenses);
    expensesService.sumBySubCategory.mockResolvedValue(rawMaterialBreakdown);
    expensesService.summary.mockResolvedValue({ byCategory });
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate grossProfit as totalRevenue minus totalRawMaterialCost', async () => {
    mockProfitInputs();

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.grossProfit).toBe(350000);
  });

  it('should calculate netProfit as grossProfit minus explicit operating expenses', async () => {
    mockProfitInputs({ rawMaterialCost: 150000, operatingExpenses: 150000 });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.totalOperatingExpenses).toBe(150000);
    expect(report.netProfit).toBe(200000);
  });

  it('should include raw material purchase expenses once in profit loss', async () => {
    mockProfitInputs({
      revenue: 0,
      totalExpenses: 12250000,
      rawMaterialCost: 12250000,
      operatingExpenses: 0,
      byCategory: [{ category: ExpenseCategory.RAW_MATERIAL, total: 12250000 }]
    });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report).toMatchObject({
      totalRevenue: 0,
      totalExpenses: 12250000,
      totalRawMaterialCost: 12250000,
      grossProfit: -12250000,
      totalOperatingExpenses: 0,
      netProfit: -12250000,
      expenseBreakdown: []
    });
  });

  it('should include only operating expense categories in the breakdown', async () => {
    mockProfitInputs({
      byCategory: [
        { category: ExpenseCategory.RAW_MATERIAL, total: 150000 },
        { category: ExpenseCategory.HARDWARE, total: 50000 },
        { category: ExpenseCategory.FUEL, total: 75000 },
        { category: ExpenseCategory.WAGES, total: 75000 }
      ]
    });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.expenseBreakdown).toEqual([
      { category: ExpenseCategory.FUEL, total: 75000 },
      { category: ExpenseCategory.WAGES, total: 75000 }
    ]);
  });

  it('should return the requested dateRange in the response', async () => {
    mockProfitInputs();

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.dateRange).toEqual({ from: '2026-06-01', to: '2026-06-30' });
  });

  it('should return zeroes when there is no revenue or expenses data', async () => {
    mockProfitInputs({ revenue: 0, totalExpenses: 0, rawMaterialCost: 0, operatingExpenses: 0 });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report).toMatchObject({
      totalRevenue: 0,
      totalExpenses: 0,
      totalRawMaterialCost: 0,
      grossProfit: 0,
      totalOperatingExpenses: 0,
      netProfit: 0,
      expenseBreakdown: []
    });
  });

  it('should return negative netProfit correctly when expenses exceed revenue', async () => {
    mockProfitInputs({
      revenue: 100000,
      rawMaterialCost: 50000,
      operatingExpenses: 150000,
      byCategory: [{ category: ExpenseCategory.FUEL, total: 150000 }]
    });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(report.grossProfit).toBe(50000);
    expect(report.totalOperatingExpenses).toBe(150000);
    expect(report.netProfit).toBe(-100000);
  });

  it('should calculate raw material cost and operating expenses with separate expense queries', async () => {
    mockProfitInputs({
      revenue: 250000,
      totalExpenses: 163500,
      rawMaterialCost: 122500,
      operatingExpenses: 41000,
      rawMaterialBreakdown: [{ category: 'SPRING_STEEL_FLAT_BAR', total: 122500 }]
    });

    const report = await service.getProfitReport({ startDate: '2026-06-01', endDate: '2026-06-30' });

    expect(expensesService.sumForCategories).toHaveBeenCalledWith(
      '2026-06-01',
      '2026-06-30',
      [ExpenseCategory.RAW_MATERIAL, ExpenseCategory.CONSUMABLE, ExpenseCategory.HARDWARE, ExpenseCategory.PAINT]
    );
    expect(expensesService.sumExcludingCategories).toHaveBeenCalledWith('2026-06-01', '2026-06-30', [
      ExpenseCategory.RAW_MATERIAL,
      ExpenseCategory.CONSUMABLE,
      ExpenseCategory.HARDWARE,
      ExpenseCategory.PAINT
    ]);
    expect(expensesService.sumBySubCategory).toHaveBeenCalledWith('2026-06-01', '2026-06-30', [
      ExpenseCategory.RAW_MATERIAL,
      ExpenseCategory.CONSUMABLE,
      ExpenseCategory.HARDWARE,
      ExpenseCategory.PAINT
    ]);
    expect(report.totalRawMaterialCost).toBe(122500);
    expect(report.rawMaterialBreakdown).toEqual([{ category: 'SPRING_STEEL_FLAT_BAR', total: 122500 }]);
    expect(report.totalOperatingExpenses).toBe(41000);
    expect(report.netProfit).toBe(86500);
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
