import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { ExpenseCategory } from './constants/expense.constants';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpenseSummaryResponseDto } from './dto/expense-summary-response.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>
  ) {}

  async findAll(query: ExpenseQueryDto): Promise<PaginatedResult<ExpenseResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.expensesRepository
      .createQueryBuilder('expense')
      .orderBy('expense.expenseDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyFilters(builder, query);
    const [expenses, total] = await builder.getManyAndCount();
    return buildPaginatedResult(expenses.map((expense) => this.mapExpense(expense)), total, page, limit);
  }

  async findOne(id: number): Promise<ExpenseResponseDto> {
    const expense = await this.findEntityById(id);
    return this.mapExpense(expense);
  }

  async findEntityById(id: number): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async create(dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    return this.mapExpense(
      await this.expensesRepository.save(this.expensesRepository.create({ ...dto, subCategory: dto.subCategory ?? null }))
    );
  }

  async createSystemExpense(dto: CreateExpenseDto, manager?: EntityManager): Promise<ExpenseResponseDto> {
    const data = {
      ...dto,
      amount: toMoney(dto.amount),
      subCategory: dto.subCategory ?? null,
      notes: dto.notes ?? null
    };

    if (manager) {
      const expense = manager.create(Expense, data);
      return this.mapExpense(await manager.save(Expense, expense));
    }

    return this.mapExpense(await this.expensesRepository.save(this.expensesRepository.create(data)));
  }

  async update(id: number, dto: UpdateExpenseDto): Promise<ExpenseResponseDto> {
    const expense = await this.findEntityById(id);
    Object.assign(expense, dto);
    return this.mapExpense(await this.expensesRepository.save(expense));
  }

  async remove(id: number): Promise<DeleteResponseDto> {
    await this.findEntityById(id);
    await this.expensesRepository.delete(id);
    return { deleted: true };
  }

  async summary(query: ExpenseQueryDto): Promise<ExpenseSummaryResponseDto> {
    const builder = this.expensesRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
      .groupBy('expense.category');
    this.applyFilters(builder, query);
    const rows = await builder.getRawMany<{ category: ExpenseCategory; total: string }>();
    const byCategory = rows.map((row) => ({ category: row.category, total: toMoney(row.total) }));
    const totalExpenses = toMoney(byCategory.reduce((sum, row) => sum + row.total, 0));
    return {
      totalExpenses,
      byCategory,
      dateRange: { from: query.startDate ?? null, to: query.endDate ?? null }
    };
  }

  async sumBetween(startDate?: string, endDate?: string, category?: ExpenseCategory): Promise<number> {
    const builder = this.expensesRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total');
    this.applyFilters(builder, { startDate, endDate, category, page: 1, limit: 20 });
    const row = await builder.getRawOne<{ total: string }>();
    return toMoney(row?.total ?? 0);
  }

  async sumExcludingCategories(
    startDate?: string,
    endDate?: string,
    excludedCategories: ExpenseCategory[] = []
  ): Promise<number> {
    const builder = this.expensesRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total');

    this.applyFilters(builder, { startDate, endDate, page: 1, limit: 20 });

    if (excludedCategories.length > 0) {
      builder.andWhere('expense.category NOT IN (:...excludedCategories)', { excludedCategories });
    }

    const row = await builder.getRawOne<{ total: string }>();
    return toMoney(row?.total ?? 0);
  }

  async sumForCategories(
    startDate?: string,
    endDate?: string,
    includedCategories: ExpenseCategory[] = []
  ): Promise<number> {
    const builder = this.expensesRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total');

    this.applyFilters(builder, { startDate, endDate, page: 1, limit: 20 });

    if (includedCategories.length > 0) {
      builder.andWhere('expense.category IN (:...includedCategories)', { includedCategories });
    }

    const row = await builder.getRawOne<{ total: string }>();
    return toMoney(row?.total ?? 0);
  }

  async sumBySubCategory(
    startDate?: string,
    endDate?: string,
    includedCategories: ExpenseCategory[] = []
  ): Promise<Array<{ category: string; total: number }>> {
    const builder = this.expensesRepository
      .createQueryBuilder('expense')
      .select("COALESCE(expense.sub_category, expense.category::text)", 'category')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
      .groupBy("COALESCE(expense.sub_category, expense.category::text)");

    this.applyFilters(builder, { startDate, endDate, page: 1, limit: 20 });

    if (includedCategories.length > 0) {
      builder.andWhere('expense.category IN (:...includedCategories)', { includedCategories });
    }

    const rows = await builder.getRawMany<{ category: string; total: string }>();
    return rows.map((row) => ({ category: row.category, total: toMoney(row.total) }));
  }

  private applyFilters(
    builder: ReturnType<Repository<Expense>['createQueryBuilder']>,
    query: Partial<ExpenseQueryDto>
  ): void {
    if (query.category) {
      builder.andWhere('expense.category = :category', { category: query.category });
    }
    if (query.startDate) {
      builder.andWhere('expense.expenseDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      builder.andWhere('expense.expenseDate <= :endDate', { endDate: query.endDate });
    }
  }

  private mapExpense(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      category: expense.category,
      subCategory: expense.subCategory,
      description: expense.description,
      amount: Number(expense.amount),
      expenseDate: expense.expenseDate as unknown as Date,
      notes: expense.notes,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    };
  }
}
