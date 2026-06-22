import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { ExpenseCategory } from './constants/expense.constants';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>
  ) {}

  async findAll(query: ExpenseQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.expensesRepository
      .createQueryBuilder('expense')
      .orderBy('expense.expenseDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyFilters(builder, query);
    const [expenses, total] = await builder.getManyAndCount();
    return buildPaginatedResult(expenses, total, page, limit);
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    return this.expensesRepository.save(this.expensesRepository.create(dto));
  }

  async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);
    Object.assign(expense, dto);
    return this.expensesRepository.save(expense);
  }

  async remove(id: number): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.expensesRepository.delete(id);
    return { deleted: true };
  }

  async summary(query: ExpenseQueryDto) {
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
}
